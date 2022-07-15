export type StringMap<T> = Record<string, T>;

export interface APIDescriptor {
    basePath: string;
    components: Components;
    paths: Array<Path>;
}

export interface Components {
    schemas?: StringMap<SchemaWithTypeName>;
}

export interface Type<T> extends TypeModifiers {
    typeName: string;
    referred: T;
    hasLoop?: boolean;
}

export type SchemaOrType = Schema | Type<Schema>;
export type Schema = SchemaUnknown | SchemaEnum | SchemaObject | SchemaArray | SchemaAllOf
    | SchemaOneOf | SchemaAnyOf | SchemaNumber | SchemaInteger | SchemaString | SchemaBoolean
    | SchemaNull | SchemaEmpty;

export type SchemaWithTypeName = Schema & {
    typeName: string;
}

export interface TypeModifiers {
    isOptional?: boolean;
    isNullable?: boolean;
}

export const isType = <T>(schemaOrType: T | Type<T>): schemaOrType is Type<T> => {
    return (schemaOrType as any).typeName !== undefined && (schemaOrType as any).referred !== undefined;
};

export const deType = <T>(type: T | Type<T>): T => {
    if (isType(type)) {
        return type.referred as T;
    }

    return type;
};

export enum SchemaType {
    UNKNOWN = 'UNKNOWN',
    ENUM = 'ENUM',
    OBJECT = 'OBJECT',
    ARRAY = 'ARRAY',
    ALL_OF = 'ALL_OF', // intersection
    ONE_OF = 'ONE_OF', // union
    ANY_OF = 'ANY_OF',
    NUMBER = 'NUMBER',
    INTEGER = 'INTEGER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    EMPTY = 'EMPTY' // nothing
}

export interface SchemaBase extends TypeModifiers {
    type: SchemaType
}

export interface SchemaUnknown extends SchemaBase {
    type: SchemaType.UNKNOWN;
}

export interface SchemaEnum extends SchemaBase {
    type: SchemaType.ENUM;
    enum: Array<string>;
}

export interface SchemaObject extends SchemaBase {
    type: SchemaType.OBJECT;
    additionalProperties: undefined | SchemaOrType;
    properties: undefined | StringMap<SchemaOrType>;
}

export interface SchemaArray extends SchemaBase {
    type: SchemaType.ARRAY;
    items: SchemaOrType
}

export interface SchemaAllOf extends SchemaBase {
    type: SchemaType.ALL_OF;
    allOf: Array<SchemaOrType>;
}

export interface SchemaOneOf extends SchemaBase {
    type: SchemaType.ONE_OF;
    oneOf: Array<SchemaOrType>;
}

// mix of intersection and union [A, B, C] => A & Optional<B & C> | B & Optional<A & C> | C & Optional<A & B>
export interface SchemaAnyOf extends SchemaBase {
    type: SchemaType.ANY_OF;
    anyOf: Array<SchemaOrType>;
}

export interface SchemaNumber extends SchemaBase {
    type: SchemaType.NUMBER;
}

export interface SchemaInteger extends SchemaBase {
    type: SchemaType.INTEGER;
}

export interface SchemaString extends SchemaBase {
    type: SchemaType.STRING;
    maxLength?: number;
}

export interface SchemaBoolean extends SchemaBase {
    type: SchemaType.BOOLEAN;
}

export interface SchemaNull extends SchemaBase {
    type: SchemaType.NULL;
}

export interface SchemaEmpty extends SchemaBase {
    type: SchemaType.EMPTY
}

export enum Verb {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export enum ParamType {
    QUERY =  'query',
    COOKIE = 'cookie',
    HEADER = 'header',
    PATH = 'path'
}

export interface Path {
    path: string;
    operations: Array<Operation>;
}

export interface Operation {
    id: string;
    path: string;
    verb: Verb;
    description?: string;
    parameters: Array<Parameter>;
    requestBody?: RequestBody;
    responses: Array<Response>;
    hasParams: boolean;
}

export interface Parameter {
    type: ParamType;
    name: string;
    schema: SchemaOrType;
}

export type ParameterWithTypeName = Parameter & {
    typeName: string;
}

export type ParameterOrType = Parameter | Type<Parameter>;

export interface RequestBody {
    schema: SchemaOrType;
}

export type RequestBodyWithTypeName = RequestBody & {
    typeName: string;
};

export interface Response {
    status: string;
    schema: SchemaOrType;
}
