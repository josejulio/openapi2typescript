import { isReference, OpenAPI3 } from './types/OpenAPI3';
import {
    APIDescriptor,
    deType,
    isType,
    Parameter,
    ParameterWithTypeName,
    ParamType,
    Path,
    RequestBody,
    RequestBodyWithTypeName,
    Response,
    Schema,
    SchemaObject,
    SchemaOrType,
    SchemaType,
    SchemaUnknown,
    SchemaWithTypeName,
    StringMap,
    Type,
    Verb
} from './types/ApiDescriptor';
import camelcase from 'camelcase';
import { sortByKey } from './Utils';
import assertNever from 'assert-never';

const refToName = (reference: OpenAPI3.Reference) => {
    const [ last ] = reference.$ref.split('/').reverse();
    return last;
};

export interface ApiDescriptorBuilderOptions {
    nonRequiredPropertyIsNull: boolean;
    basePath?: string;
}

const verbs = [ Verb.GET, Verb.POST, Verb.PUT, Verb.DELETE ];

const EMPTY_SCHEMA_KEY = '__Empty';

type KeysWith<V, K, R> = K extends string ? K extends keyof V ? V[K] extends R ? K : never : never : never;

class ApiDescriptorBuilder {
    readonly topSchemas: StringMap<SchemaWithTypeName>;
    readonly topParameters: StringMap<ParameterWithTypeName>;
    readonly topRequestBodies: StringMap<RequestBodyWithTypeName>;

    readonly openapi: Readonly<OpenAPI3>;
    readonly options: ApiDescriptorBuilderOptions;

    constructor(openapi: OpenAPI3, options: Partial<ApiDescriptorBuilderOptions>) {
        this.openapi = openapi;
        this.topSchemas = this.getTopSchemasPlaceholders();
        this.topParameters = this.getTopParameters();
        this.topRequestBodies = this.getTopRequestBodies();
        this.options = {
            nonRequiredPropertyIsNull: false,
            basePath: undefined,
            ...options
        };
    }

    public build(): APIDescriptor {
        const descriptor: APIDescriptor = {
            basePath: this.getBasePath(),
            components: {
                schemas: this.getSchemaComponents()
            },
            paths: this.getPaths()
        };

        this.findAndFixLoops(descriptor);

        return descriptor;
    }

    private findAndFixLoops(descriptor: APIDescriptor) {
        for (const [ name, schema ] of Object.entries(descriptor.components?.schemas ?? {})) {
            this.findAndFixLoopsOfSchema(schema, [ name ]);
        }
    }

    private findAndFixLoopsOfArraySchema(schemasOrTypes: Array<SchemaOrType>, typePath: Array<string>) {
        for (const schemaOrType of schemasOrTypes) {
            this.findAndFixLoopsOfSchema(schemaOrType, typePath);
        }
    }

    private findAndFixLoopsOfSchema(schemaOrType: SchemaOrType, typePath: Array<string>) {
        const localTypePath = [ ...typePath ];
        if (isType(schemaOrType)) {
            if (localTypePath.includes(schemaOrType.typeName)) {
                schemaOrType.hasLoop = true;
            }

            localTypePath.push(schemaOrType.typeName);

            if (schemaOrType.hasLoop) {
                // Loop already identified, nothing else to do.
                return;
            }
        }

        const schema = deType(schemaOrType);

        switch (schema.type) {
            case SchemaType.OBJECT:
                if (schema.properties) {
                    this.findAndFixLoopsOfArraySchema(Object.values(schema.properties), localTypePath);
                }

                if (schema.additionalProperties) {
                    this.findAndFixLoopsOfSchema(schema.additionalProperties, localTypePath);
                }

                break;
            case SchemaType.ARRAY:
                if (schema.items) {
                    this.findAndFixLoopsOfSchema(schema.items, localTypePath);
                }

                break;
            case SchemaType.ANY_OF:
                this.findAndFixLoopsOfArraySchema(schema.anyOf, localTypePath);
                break;
            case SchemaType.ONE_OF:
                this.findAndFixLoopsOfArraySchema(schema.oneOf, localTypePath);
                break;
            case SchemaType.ALL_OF:
                this.findAndFixLoopsOfArraySchema(schema.allOf, localTypePath);
                break;
        }
    }

    private getSchemaComponents(): StringMap<SchemaWithTypeName> {
        if (this.openapi.components?.schemas) {
            for (const [ typeName, schema ] of Object.entries(this.openapi.components.schemas)) {
                if (isReference(schema)) {
                    throw new Error('Invalid reference found at component level');
                } else {
                    Object.assign(this.topSchemas[typeName], {
                        ...this.getSchema(schema) as SchemaWithTypeName
                    });
                }
            }
        }

        return this.topSchemas;
    }

    private getPaths(): Array<Path> {
        const paths: Array<Path> = [];
        if (this.openapi.paths) {
            for (const [ pathKey, openApiPath ] of sortByKey(Object.entries(this.openapi.paths))) {
                const path: Path = {
                    operations: [],
                    path: pathKey
                };

                for (const verb of verbs) {
                    if (isReference(openApiPath)) {
                        throw new Error('Unimplemented behavior for paths as references');
                    }

                    const openApiOp = ApiDescriptorBuilder.operationOfPath(openApiPath, verb.toLowerCase() as Lowercase<Verb>);

                    if (!openApiOp) {
                        continue;
                    }

                    const id = camelcase(
                        openApiOp.operationId ?? `${verb}_${pathKey.replace(/{/g, 'By_').replace(/[/}]/g, '_')}`,
                        {
                            pascalCase: true
                        }
                    );

                    let requestBody;
                    if (openApiOp.requestBody) {
                        requestBody = {
                            schema: this.getRequestBodyOrResponseSchemaOrType(openApiOp.requestBody)
                        };
                    }

                    const responses = this.getResponses(openApiOp.responses);

                    if (openApiOp) {
                        const parameters = this.getParameters(openApiOp.parameters);
                        path.operations.push({
                            id,
                            description: openApiOp.summary,
                            parameters,
                            path: pathKey,
                            verb,
                            requestBody,
                            responses,
                            hasParams: !!requestBody || parameters.length > 0
                        });
                    }
                }

                paths.push(path);
            }
        }

        return paths;
    }

    private getRequestBody(requestOrRef: OpenAPI3.RequestBody | OpenAPI3.Reference) : RequestBody {
        const schema = this.getRequestBodyOrResponseSchemaOrType(requestOrRef);

        return {
            schema
        };
    }

    private getEmptyType(): Type<Schema> {
        if (!this.topSchemas[EMPTY_SCHEMA_KEY]) {
            this.topSchemas[EMPTY_SCHEMA_KEY] = {
                typeName: EMPTY_SCHEMA_KEY,
                type: SchemaType.STRING,
                maxLength: 0,
                isOptional: true
            };
        }

        return {
            typeName: EMPTY_SCHEMA_KEY,
            referred: this.topSchemas[EMPTY_SCHEMA_KEY]
        };
    }

    private getResponses(oapiResponses: OpenAPI3.Responses): Array<Response> {
        const responses: Array<Response> = [];
        if (oapiResponses) {
            if (oapiResponses.default) {
                throw new Error('default response not yet supported');
            }

            for (const [ status, oapiResponse ] of sortByKey(Object.entries(oapiResponses))) {
                const response = this.getRequestBodyOrResponseSchemaOrType(oapiResponse);

                responses.push({
                    status,
                    schema: ApiDescriptorBuilder.isSchemaEmpty(response) ? this.getEmptyType() : response
                });
            }
        }

        return responses;
    }

    private getRequestBodyOrResponseSchemaOrType(
        requestOrResponse: OpenAPI3.RequestBody | OpenAPI3.Response | OpenAPI3.Reference) : SchemaOrType {
        if (isReference(requestOrResponse)) {
            const typeName = refToName(requestOrResponse);
            if (this.topRequestBodies[typeName]?.schema) {
                return this.topRequestBodies[typeName].schema;
            }

            return {
                type: SchemaType.UNKNOWN
            };
        } else if (requestOrResponse.content) {
            const keys = Object.keys(requestOrResponse.content);
            if (keys.length > 0) {
                const firtSchema = requestOrResponse.content[keys[0]].schema;
                if (firtSchema) {
                    return this.getSchema(firtSchema);
                }
            }
        }

        return {
            type: SchemaType.EMPTY
        };
    }

    private getParameters(oapiParameters: Array<OpenAPI3.Parameter | OpenAPI3.Reference> | undefined) {
        if (!oapiParameters) {
            return [];
        }

        const parameters: Array<Parameter> = [];
        for (const oapiParam of oapiParameters) {
            if (isReference(oapiParam)) {
                const typeName = refToName(oapiParam);
                parameters.push(this.topParameters[typeName]);
            } else {
                const paramType = this.getParamType(oapiParam.in);

                let typeOrSchema;
                if (oapiParam.schema !== undefined) {
                    typeOrSchema = this.getSchema(oapiParam.schema);
                } else {
                    typeOrSchema = {
                        type: SchemaType.UNKNOWN
                    } as SchemaOrType;
                }

                if (oapiParam.required || paramType === ParamType.PATH) {
                    typeOrSchema.isOptional = false;
                } else if (!oapiParam.required) {
                    typeOrSchema.isOptional = true;
                }

                parameters.push({
                    type: paramType,
                    name: oapiParam.name,
                    schema: typeOrSchema
                });
            }
        }

        return parameters;
    }

    private getSchemaType(schema: OpenAPI3.Schema): Schema {
        if (schema.allOf) {
            return {
                type: SchemaType.ALL_OF,
                allOf: schema.allOf.map(s => this.getSchema(s))
            };
        } else if (schema.oneOf) {
            return {
                type: SchemaType.ONE_OF,
                oneOf: schema.oneOf.map(s => this.getSchema(s))
            };
        } else if (schema.anyOf) {
            return {
                type: SchemaType.ANY_OF,
                anyOf: schema.anyOf.map(s => this.getSchema(s))
            };
        } else if (schema.enum) {
            return {
                type: SchemaType.ENUM,
                enum: schema.enum
            };
        } else if (schema.type) {
            switch (schema.type) {
                case 'array':
                    return {
                        type: SchemaType.ARRAY,
                        items: schema.items ? this.getSchema(schema.items) : {
                            type: SchemaType.UNKNOWN
                        }
                    };
                case 'number':
                    return {
                        type: SchemaType.NUMBER
                    };
                case 'integer':
                    return {
                        type: SchemaType.INTEGER
                    };
                case 'string':
                    return {
                        type: SchemaType.STRING
                    };
                case 'boolean':
                    return {
                        type: SchemaType.BOOLEAN
                    };
                case 'null':
                    return {
                        type: SchemaType.NULL
                    };
                case 'object':
                    return this.getSchemaForObject({ ...schema, type: 'object' });
                default:
                    throw new Error(`Unknown type found: ${schema.type} for schema ${JSON.stringify(schema)}`);
            }
        } else if (schema.properties) { // it didn't had a type, but has properties.
            return this.getSchemaForObject({ ...schema, type: 'object' });
        } else {
            return {
                type: SchemaType.UNKNOWN
            };
        }
    }

    private getSchema(schemaOrRef: OpenAPI3.Schema | OpenAPI3.Reference): SchemaOrType {
        if (isReference(schemaOrRef)) {
            const typeName = refToName(schemaOrRef);
            return {
                typeName,
                isNullable: false,
                isOptional: false,
                referred: this.topSchemas[typeName]
            };
        } else {
            const schema = this.getSchemaType(schemaOrRef);
            if (schemaOrRef.nullable) {
                schema.isNullable = true;
            }

            return schema;
        }
    }

    private getSchemaForObject(schema: OpenAPI3.Schema & { type: 'object' }): SchemaObject | SchemaUnknown {
        if (schema.properties || schema.additionalProperties) {
            let additionalProperties: SchemaObject['additionalProperties'] = undefined;
            if (schema.additionalProperties) {
                if (schema.additionalProperties === true) {
                    additionalProperties = {
                        type: SchemaType.UNKNOWN
                    };
                } else {
                    additionalProperties = this.getSchema(schema.additionalProperties);
                }
            }

            let properties: SchemaObject['properties'] = undefined;
            if (schema.properties) {
                properties = {};
                for (const [ key, value ] of sortByKey(Object.entries(schema.properties))) {
                    properties[key] = this.getSchema(value);
                    if (!schema.required?.includes(key)) {
                        properties[key].isOptional = true;
                        if (this.options.nonRequiredPropertyIsNull) {
                            properties[key].isNullable = true;
                        }
                    }
                }
            }

            return {
                type: SchemaType.OBJECT,
                additionalProperties,
                properties
            };
        }

        return {
            type: SchemaType.UNKNOWN
        };
    }

    private getBasePath(): string {
        if (this.options.basePath) {
            return this.options.basePath;
        }

        if (this.openapi.servers) {
            const variables = this.openapi.servers[0]?.variables;
            if (variables?.basePath?.default) {
                return variables.basePath.default;
            }
        }

        return '';
    }

    private getTopSchemasPlaceholders(): StringMap<SchemaWithTypeName> {
        const schemas: StringMap<SchemaWithTypeName> = {};
        if (this.openapi.components?.schemas) {
            for (const [ typeName ] of sortByKey(Object.entries(this.openapi.components.schemas))) {
                schemas[typeName] = {
                    typeName
                } as unknown as SchemaWithTypeName;
            }
        }

        return schemas;
    }

    private getTopParameters(): StringMap<ParameterWithTypeName> {
        const parameters: StringMap<ParameterWithTypeName> = {};
        if (this.openapi.components?.parameters) {
            for (const [ typeName, parameter ] of sortByKey(Object.entries(this.openapi.components.parameters))) {
                if (isReference(parameter)) {
                    throw new Error('Invalid reference found at parameters level');
                }

                let schema: SchemaOrType;
                if (parameter.schema) {
                    schema = this.getSchema(parameter.schema);
                } else {
                    schema = {
                        type: SchemaType.UNKNOWN
                    };
                }

                const paramType = this.getParamType(parameter.in);

                if (parameter.required || paramType === ParamType.PATH) {
                    schema.isOptional = false;
                } else if (!parameter.required) {
                    schema.isOptional = true;
                }

                parameters[typeName] = {
                    typeName,
                    name: parameter.name,
                    type: paramType,
                    schema
                } as ParameterWithTypeName;
            }
        }

        return parameters;
    }

    private getTopRequestBodies(): StringMap<RequestBodyWithTypeName> {
        const requestBodies: StringMap<RequestBodyWithTypeName> = {};
        if (this.openapi.components?.requestBodies) {
            for (const [ typeName, requestBody ] of sortByKey(Object.entries(this.openapi.components.requestBodies))) {
                if (isReference(requestBody)) {
                    throw new Error('Invalid reference found at request bodies level');
                }

                requestBodies[typeName] = {
                    ...this.getRequestBody(requestBody),
                    typeName
                };
            }
        }

        return requestBodies;
    }

    private getParamType(rawParamType: OpenAPI3.Parameter['in']): ParamType {
        switch (rawParamType) {
            case 'header':
                return ParamType.HEADER;
            case 'query':
                return ParamType.QUERY;
            case 'cookie':
                return ParamType.COOKIE;
            case 'path':
                return ParamType.PATH;
            default:
                assertNever(rawParamType);
        }
    }

    private static operationOfPath(
        path: OpenAPI3.Path,
        verb: KeysWith<OpenAPI3.Path, Lowercase<Verb>, OpenAPI3.Operation | undefined>
    ): OpenAPI3.Operation | undefined {
        return path[verb];
    }

    private static isSchemaEmpty(schemaOrType: SchemaOrType) {
        const schema = deType(schemaOrType);
        return schema.type === SchemaType.EMPTY;
    }
}

export const buildApiDescriptor = (openapi: Readonly<OpenAPI3>, options?: Partial<ApiDescriptorBuilderOptions>): APIDescriptor => {
    const builder = new ApiDescriptorBuilder(openapi, options ?? {});
    return builder.build();
};
