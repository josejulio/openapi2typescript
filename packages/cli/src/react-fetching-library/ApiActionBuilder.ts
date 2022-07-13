import { APIDescriptor, deType, isType, Operation, ParamType, SchemaType } from '../core/types/ApiDescriptor';
import { Buffer, BufferType } from '../core/types/Buffer';
import { ApiActionBuilder } from '../core/ApiActionBuilder';
import { Options } from '../core/ApiBase';

export class ReactFetchingLibraryApiActionBuilder extends ApiActionBuilder {

    constructor(api: APIDescriptor, buffer: Buffer, options?: Partial<Options>) {
        super(api, buffer, options);
        // Required imports
        if (!this.options.skipTypes) {
            buffer.write('import { Action } from \'react-fetching-library\';\n', BufferType.HEADER);
        }

        buffer.write('import { ValidateRule } from \'openapi2typescript\';\n', BufferType.HEADER);

        buffer.write('import { actionBuilder, '
            + 'useWrappedMutation, useWrappedParameterizedQuery, useWrappedQuery, useWrappedRequest'
            + ' } from \'openapi2typescript-plugin-react-fetching-library\';\n', BufferType.HEADER);
    }

    protected buildActionFunction(operation: Operation) {
        const actionType = this.actionEndpointType();
        const payloadType = this.payloadEndpointType();

        if (!this.options.skipTypes) {
            this.appendTemp(`type ${actionType} = Action<Operations.${operation.id}.${payloadType}>;\n`);
        }

        this.appendTemp(`const ${this.functionEndpointType()} = (`);
        if ((operation.parameters && operation.parameters.length > 0) || operation.requestBody) {
            this.appendTemp('params');
            if (!this.options.skipTypes) {
                this.appendTemp(`: Operations.${operation.id}.Params`);
            }

            if ((operation.requestBody === undefined || operation.requestBody.schema.isOptional)
                && operation.parameters.every(op => op.schema.isOptional)) {
                this.appendTemp(' = {}');
            }
        }

        this.appendTemp(')');

        if (!this.options.skipTypes) {
            this.appendTemp(`: ${actionType}`);
        }

        this.appendTemp(' => {\n');

        // Path params
        this.appendTemp(`const path = \'${this.absolutePath(operation.path)}\'\n`);
        if (operation.parameters) {
            this.filteredParameters(operation.parameters).filter(p => p.type === ParamType.PATH).forEach(param => {
                this.appendTemp(`.replace('{${param.name}}', params['${this.paramName(param.name)}'].toString())\n`);
            });
        }

        this.appendTemp(';\n');

        // Query params
        this.appendTemp('const query = {}');
        if (!this.options.skipTypes) {
            this.appendTemp(' as Record<string, any>');
        }

        this.appendTemp(';\n');

        if (operation.parameters) {
            this.filteredParameters(operation.parameters).filter(p => p.type === ParamType.QUERY).forEach(param => {
                this.appendTemp(`if (params['${this.paramName(param.name)}'] !== undefined) {\n`);
                this.appendTemp(`query['${param.name}'] = params['${this.paramName(param.name)}'];\n`);
                this.appendTemp('}\n\n');
            });
        }

        this.appendTemp(`return actionBuilder('${operation.verb.toUpperCase()}', path)\n`);
        this.appendTemp('.queryParams(query)\n');

        if (operation.requestBody) {
            const schema = deType(operation.requestBody.schema);
            if (schema.type === SchemaType.OBJECT && schema.properties) {
                this.appendTemp('.data(\n');
                this.untransform(schema.properties, 'params.body');
                this.appendTemp(')\n');
            } else {
                this.appendTemp('.data(params.body)\n');
            }
        }

        this.appendTemp('.build();\n');
        this.appendTemp('}\n');

        if (operation.responses) {
            const responses = Object.values(operation.responses);
            this.appendTemp('const rules = [\n');

            responses.forEach((response, index, array) => {
                const responseType = isType(response.schema) ? `'${this.responseTypeName(response, false)}'` : '\'unknown\'';
                const responseTypeName = isType(response.schema) ?
                    this.responseTypeName(response, true)
                    : `Operations.${operation.id}.${this.responseTypeName(response, true)}`;
                this.appendTemp(`new ValidateRule(${responseTypeName}, ${responseType}, ${response.status})\n`);
                if (array.length !== index + 1) {
                    this.appendTemp(',\n');
                }
            });
            this.appendTemp('];\n');

            const foundHooks = [];

            if (operation.verb === 'GET') {
                foundHooks.push('useQuery');
                this.appendTemp(
                    `const useQuery = (params: Operations.${operation.id}.Params, initFetch?: boolean) =>`
                + `useWrappedQuery<Operations.${operation.id}.Payload>(actionCreator(params), rules, initFetch);\n`
                );

                foundHooks.push('useParameterizedQuery');
                this.appendTemp(
                    `const useParameterizedQuery = () => `
                + `useWrappedParameterizedQuery<Operations.${operation.id}.Payload, Operations.${operation.id}.Params>`
                    + `(actionCreator, rules);\n`
                );

            } else {
                foundHooks.push('useMutation');
                this.appendTemp(
                    `const useMutation = () => `
                        + `useWrappedMutation<Operations.${operation.id}.Payload, Operations.${operation.id}.Params>`
                        + `(actionCreator, rules);\n`);
            }

            foundHooks.push('useRequest');
            this.appendTemp(`const useRequest = () => useWrappedRequest(actionCreator, rules);`);

            this.appendTemp(`return { ${foundHooks.join(', ')} };`);
        }
    }

}
