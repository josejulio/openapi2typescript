export type Verb = 'get' | 'post' | 'put' | 'delete';

export const isReference = (
    schema: OpenAPI3.Schema | OpenAPI3.Reference | OpenAPI3.RequestBody | OpenAPI3.Parameter
): schema is OpenAPI3.Reference => {
    return schema.hasOwnProperty('$ref');
};

// This is copied from here, but hasn't been published:
// https://github.com/foxel/openapi3-typescript-codegen/blob/master/lib/schema.ts
type StringMap<T> = {
    [key: string]: T;
};
export interface OpenAPI3 {
    openapi: string;
    info: OpenAPI3.Info;
    servers?: OpenAPI3.Server[];
    paths?: OpenAPI3.Paths;
    components?: OpenAPI3.Components;
    security?: OpenAPI3.SecurityRequirement[];
    tags?: OpenAPI3.Tag[];
    externalDocs?: OpenAPI3.ExternalDocs;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace OpenAPI3 {
    export interface Info {
        title: string;
        description?: string;
        termsOfService?: string;
        contact?: OpenAPI3.Contact;
        license?: OpenAPI3.License;
        version: string;
    }
    export interface Contact {
        name?: string;
        url?: string;
        email?: string;
    }
    export interface License {
        name: string;
        url?: string;
    }
    export interface Server {
        name: string;
        description?: string;
        variables?: StringMap<OpenAPI3.ServerVariable>;
    }
    export interface ServerVariable {
        enum?: string[];
        default: string;
        description?: string;
    }
    export interface Components {
        schemas?: StringMap<OpenAPI3.Schema | OpenAPI3.Reference>;
        responses?: StringMap<OpenAPI3.Response | OpenAPI3.Reference>;
        parameters?: StringMap<OpenAPI3.Parameter | OpenAPI3.Reference>;
        examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
        requestBodies?: StringMap<OpenAPI3.RequestBody | OpenAPI3.Reference>;
        headers?: StringMap<OpenAPI3.Header | OpenAPI3.Reference>;
        securitySchemes?: StringMap<OpenAPI3.SecurityScheme | OpenAPI3.Reference>;
        links?: StringMap<OpenAPI3.Link | OpenAPI3.Reference>;
        callbacks?: StringMap<OpenAPI3.Callback | OpenAPI3.Reference>;
    }
    export interface Paths {
        [path: string]: OpenAPI3.Path | OpenAPI3.Reference;
    }
    export interface Path {
        summary?: string;
        description?: string;
        get?: OpenAPI3.Operation;
        put?: OpenAPI3.Operation;
        post?: OpenAPI3.Operation;
        delete?: OpenAPI3.Operation;
        options?: OpenAPI3.Operation;
        head?: OpenAPI3.Operation;
        patch?: OpenAPI3.Operation;
        trace?: OpenAPI3.Operation;
        servers?: OpenAPI3.Server[];
        parameters?: (OpenAPI3.Parameter | OpenAPI3.Reference)[];
    }
    export interface Operation {
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: OpenAPI3.ExternalDocs;
        operationId?: string;
        parameters?: (OpenAPI3.Parameter | OpenAPI3.Reference)[];
        requestBody?: OpenAPI3.RequestBody | OpenAPI3.Reference;
        responses: OpenAPI3.Responses;
        callbacks?: StringMap<OpenAPI3.Callback | OpenAPI3.Reference>;
        deprecated?: boolean;
        security?: OpenAPI3.SecurityRequirement[];
        servers?: OpenAPI3.Server[];
    }
    export interface ExternalDocs {
        description?: string;
        url: string;
    }
    export interface Parameter {
        name: string;
        in: 'query' | 'header' | 'path' | 'cookie';
        description?: string;
        required?: boolean;
        deprecated?: boolean;
        allowEmptyValue?: boolean;
        style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
        explode?: boolean;
        allowReserved?: boolean;
        schema?: OpenAPI3.Schema | OpenAPI3.Reference;
        example?: any;
        examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
        content?: StringMap<OpenAPI3.MediaType>;
    }
    export interface RequestBody {
        description?: string;
        content: StringMap<OpenAPI3.MediaType>;
        required?: boolean;
    }
    export interface MediaType {
        schema?: OpenAPI3.Schema | OpenAPI3.Reference;
        example?: any;
        examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
        encoding?: StringMap<OpenAPI3.Encoding>;
    }
    export interface Encoding {
        contentType?: string;
        headers?: StringMap<OpenAPI3.Header | OpenAPI3.Reference>;
        style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
        explode?: boolean;
        allowReserved?: boolean;
    }
    export type Responses = {
        default?: OpenAPI3.Response | OpenAPI3.Reference;
    } & {
        [status: string]: OpenAPI3.Response | OpenAPI3.Reference;
    }

    export interface Response {
        description: string;
        headers?: StringMap<OpenAPI3.Header | OpenAPI3.Reference>;
        content?: StringMap<OpenAPI3.MediaType>;
        links?: StringMap<OpenAPI3.Link | OpenAPI3.Reference>;
    }
    export interface Callback {
        [callbackKey: string]: OpenAPI3.Path;
    }
    export interface Example {
        summary?: string;
        description?: string;
        value?: any;
        externalValue?: string;
    }
    export interface Link {
        operationRef?: string;
        operationId?: string;
        parameters?: StringMap<any>;
        requestBody?: any;
        description?: string;
        server?: OpenAPI3.Server;
    }
    export interface Header {
        description?: string;
        required?: boolean;
        deprecated?: boolean;
        allowEmptyValue?: boolean;
        style?: 'simple';
        explode?: boolean;
        allowReserved?: boolean;
        schema?: OpenAPI3.Schema;
        example?: any;
        examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
    }
    export interface Tag {
        name: string;
        description?: string;
        externalDocs?: OpenAPI3.ExternalDocs;
    }
    export interface Reference {
        '$ref': string;
    }
    export interface Schema {
        title?: string;
        multipleOf?: number;
        maximum?: number;
        exclusiveMaximum?: number;
        minimum?: number;
        exclusiveMinimum?: number;
        maxLength?: number;
        minLength?: number;
        pattern?: string;
        maxItems?: number;
        minItems?: number;
        uniqueItems?: number;
        maxProperties?: number;
        minProperties?: number;
        required?: string[];
        enum?: string[];
        type?: string;
        allOf?: (OpenAPI3.Schema | OpenAPI3.Reference)[];
        oneOf?: (OpenAPI3.Schema | OpenAPI3.Reference)[];
        anyOf?: (OpenAPI3.Schema | OpenAPI3.Reference)[];
        not?: (OpenAPI3.Schema | OpenAPI3.Reference)[];
        items?: OpenAPI3.Schema | OpenAPI3.Reference;
        properties?: StringMap<OpenAPI3.Schema | OpenAPI3.Reference>;
        additionalProperties?: boolean | OpenAPI3.Schema | OpenAPI3.Reference;
        description?: string;
        format?: string;
        default?: any;
        nullable?: boolean;
        discriminator?: OpenAPI3.Discriminator;
        readOnly?: boolean;
        writeOnly?: boolean;
        xml?: OpenAPI3.XML;
        externalDocs?: OpenAPI3.ExternalDocs;
        example?: any;
        deprecated?: boolean;
    }
    export interface Discriminator {
        propertyName: string;
        mapping?: StringMap<string>;
    }
    export interface XML {
        name?: string;
        namespace?: string;
        prefix?: string;
        attribute?: boolean;
        wrapped?: boolean;
    }
    export type SecurityScheme = {
        type: 'apiKey';
        description?: string;
        name: string;
        in: 'query' | 'header' | 'cookie';
    } | {
        type: 'http';
        description?: string;
        scheme: 'basic' | 'bearer' | string;
        bearerFormat?: string;
    } | {
        type: 'oauth2';
        description?: string;
        flows: OpenAPI3.OAuthFlows;
    } | {
        type: 'openIdConnect';
        description?: string;
        openIdConnectUrl: string;
    };
    export interface OAuthFlows {
        implicit?: OpenAPI3.OAuthFlow;
        password?: OpenAPI3.OAuthFlow;
        clientCredentials?: OpenAPI3.OAuthFlow;
        authorizationCode?: OpenAPI3.OAuthFlow;
    }
    export interface OAuthFlow {
        authorizationUrl: string;
        tokenUrl: string;
        refreshUrl?: string;
        scopes: StringMap<string>;
    }
    export interface SecurityRequirement {
        [securitySchemeName: string]: string[];
    }
}
