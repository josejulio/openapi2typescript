import camelcase from 'camelcase';
import {
    APIDescriptor, deType,
    isType,
    Operation,
    Parameter,
    ParameterOrType,
    ParamType,
    RequestBody,
    Response
} from './types/ApiDescriptor';
import { ApiBase, Options } from './ApiBase';
import { Buffer, BufferType } from './types/Buffer';

export abstract class ApiActionBuilder extends ApiBase {

    private unknownTypeFound: boolean;

    constructor(api: APIDescriptor, buffer: Buffer, options?: Partial<Options>) {
        super(api, buffer, {
            ...options,
            useFunctionTypeGenerator: false,
            schemasPrefix: 'Schemas.'
        });
        this.unknownTypeFound = false;
        if (!this.options.skipTypes) {
            buffer.write('import { ValidatedResponse } from \'openapi2typescript\';\n', BufferType.HEADER);
        }
    }

    protected abstract buildActionFunction(operation: Operation): void;

    public build() {
        this.unknownTypeFound = false;

        if (this.api.paths) {
            const paths = this.api.paths;

            this.appendTemp('export module Operations {\n');
            for (const path of paths) {
                for (const operation of path.operations) {
                    this.appendTemp(`export module ${operation.id} {\n`);

                    this.anonymousTypes(operation);
                    this.params(operation);
                    this.payloadType(operation);
                    this.appendTemp('}\n');
                }
            }

            this.appendTemp('}\n\n');

            this.appendTemp('const createClient = () => {\n');
            const operations = [];

            for (const path of paths) {
                for (const operation of path.operations) {
                    this.appendTemp(`// ${operation.verb} ${operation.path}\n`);
                    if (operation.description) {
                        this.appendTemp(
                            ...operation.description.split('\n').map(d => `// ${d}\n`)
                        );
                    }

                    operations.push(operation.id);

                    this.appendTemp(`const ${operation.id} = (() => {\n`);
                    this.actions(operation);
                    this.appendTemp('\n');

                    this.appendTemp('})();\n');
                }
            }

            this.appendTemp(`return { ${operations.join(', ')} };`);

            this.appendTemp('};\n\n');
            this.appendTemp('export const client = createClient();\n');
            this.writeTempToBuffer(BufferType.OPERATIONS);
        }
    }

    protected filteredParameters(parameters: Array<ParameterOrType>) {
        return parameters.map(p => deType<Parameter>(p)).filter(p => p.type !== ParamType.COOKIE);
    }

    protected anonymousTypes(operation: Operation) {
        if (operation.parameters) {
            this.filteredParameters(operation.parameters).forEach(p => {
                if (!isType(p.schema)) {
                    const propName = this.anonymousParamTypeName(p.name);
                    this.appendTemp(`const ${propName} = `);
                    this.schema(p.schema, true);
                    this.appendTemp(';\n');

                    if (!this.options.skipTypes) {
                        this.appendTemp(`type ${propName} = `);
                        if (this.options.explicitTypes) {
                            this.schemaTypes(p.schema, true);
                        } else {
                            this.appendTemp(`z.infer<typeof ${propName}>`);
                        }

                        this.appendTemp(';\n');
                    }
                }
            });
        }

        if (operation.requestBody) {
            if (!isType(operation.requestBody.schema)) {
                const propName = this.anonymousParamTypeName('body');
                this.appendTemp(`export const ${propName} = `);
                this.schema(operation.requestBody.schema, true);
                this.appendTemp(';\n');
                if (!this.options.skipTypes) {
                    this.appendTemp(`export type ${propName} = `);
                    if (this.options.explicitTypes) {
                        this.schemaTypes(operation.requestBody.schema, true);
                    } else {
                        this.appendTemp(`z.infer<typeof ${propName}>`);
                    }

                    this.appendTemp(';\n');
                }
            }
        }

        for (const response of operation.responses) {
            if (!isType(response.schema)) {
                const propName = this.responseTypeName(response, false);
                this.appendTemp(`export const ${propName} = `);
                this.schema(response.schema, true);
                this.appendTemp(';\n');
                if (!this.options.skipTypes) {
                    this.appendTemp(`export type ${propName} = `);
                    if (this.options.explicitTypes) {
                        this.schemaTypes(response.schema, true);
                    } else {
                        this.appendTemp(`z.infer<typeof ${propName}>`);
                    }

                    this.appendTemp(';\n');
                }
            }
        }
    }

    protected params(operation: Operation) {
        if ((operation.parameters.length > 0) || operation.requestBody) {
            if (this.options.skipTypes) {
                this.appendTemp(`/*\n Params\n`);
            } else {
                this.appendTemp(`export interface Params {\n`);
            }

            if (operation.parameters.length > 0) {
                this.filteredParameters(operation.parameters).forEach((p, index, array) => {
                    const isRequired = !p.schema.isOptional;
                    this.appendTemp(`'${this.paramName(p.name)}'${isRequired ? '' : '?'}:`);
                    if (isType(p.schema)) {
                        this.appendTemp(this.fullTypeName(p.schema));
                    } else {
                        this.appendTemp(this.anonymousParamTypeName(p.name));
                    }

                    if (operation.requestBody || array.length !== index + 1) {
                        this.appendTemp(',\n');
                    }
                });
            }

            if (operation.requestBody) {
                const typeName = this.requestBodySchemaTypeName(operation.requestBody);
                this.appendTemp('body');

                if (isType(operation.requestBody.schema) && operation.requestBody.schema.isOptional) {
                    this.appendTemp('?');
                }

                this.appendTemp(`: ${typeName}`);
            }

            if (this.options.skipTypes) {
                this.appendTemp('\n*/\n');
            } else {
                this.appendTemp('\n}\n\n');
            }
        }
    }

    protected payloadType(operation: Operation) {
        if (operation.responses.length) {
            if (!this.options.skipTypes) {
                const payloadType = this.payloadEndpointType();
                this.appendTemp(`export type ${payloadType} = `);

                for (const response of operation.responses) {
                    const responseType = this.responseTypeName(response, true);
                    const responseTypeString =  isType(response.schema) ? this.responseTypeName(response, false) : 'unknown';
                    this.appendTemp(`ValidatedResponse<'${responseTypeString}', ${response.status}, ${responseType}> | `);
                }

                this.appendTemp('ValidatedResponse<\'unknown\', undefined, unknown>;\n');
            }
        }
    }

    protected actions(operation: Operation) {
        if (operation.responses.length) {
            this.buildActionFunction(operation);
        }
    }

    protected requestBodySchemaTypeName(requestBody: RequestBody): string {
        if (isType(requestBody.schema)) {
            return this.fullTypeName(requestBody.schema);
        } else {
            return this.anonymousParamTypeName('body');
        }
    }

    protected responseTypeName(response: Response, fullName: boolean): string {
        if (isType(response.schema)) {
            if (fullName) {
                return this.fullTypeName(response.schema);
            } else {
                return response.schema.typeName;
            }
        } else {
            return this.anonymousParamTypeName(`Response${response.status}`);
        }
    }

    protected anonymousParamTypeName(name: string) {
        const filteredName = name.replace(/[/{}\[\]:]/g, '_');
        const propertyName = camelcase(filteredName, {
            pascalCase: true
        });
        return `${propertyName}`;
    }

    protected actionEndpointType() {
        return `ActionCreator`;
    }

    protected payloadEndpointType() {
        return 'Payload';
    }

    protected functionEndpointType() {
        return `actionCreator`;
    }

    protected absolutePath(path: string) {
        return `${this.api.basePath}${path}`;
    }

    protected paramName(name: string) {
        return camelcase(name.replace(/[:\[\]]/g, '_'));
    }
}
