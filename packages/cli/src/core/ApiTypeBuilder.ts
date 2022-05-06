import { ApiBase, Options } from './ApiBase';
import { APIDescriptor, SchemaWithTypeName } from './types/ApiDescriptor';
import { BufferType, Buffer } from './types/Buffer';
import { sortByKey } from './Utils';

export class ApiTypeBuilder extends ApiBase {

    constructor(apiDescriptor: APIDescriptor, buffer: Buffer, options?: Partial<Options>) {
        super(apiDescriptor, buffer, options);
    }

    public build() {
        if (this.api.components?.schemas) {
            const schemas = sortByKey(Object.entries(this.api.components.schemas)).map(([ _key, value ]) => value);
            if (schemas.length > 0) {
                this.appendTemp('export module Schemas {\n');
                this.types(schemas);
                this.functionTypes(schemas);
                this.appendTemp('}\n');
                this.writeTempToBuffer(BufferType.COMPONENTS);
            }
        }
    }

    private types(schemas: Array<SchemaWithTypeName>) {
        for (const schema of schemas) {
            this.appendTemp(`export const ${schema.typeName} = ${this.functionName(schema)}();\n`);
            if (!this.options.skipTypes) {
                this.appendTemp(`export type ${schema.typeName} = `);
                if (this.options.explicitTypes) {
                    this.schemaTypes(schema);
                } else {
                    this.appendTemp(`z.infer<typeof ${schema.typeName}>`);
                }

                this.appendTemp(';\n');
            }

            this.appendTemp('\n');
        }
    }

    private functionTypes(schemas: Array<SchemaWithTypeName>) {
        for (const schema of schemas) {
            this.appendTemp(`function ${this.functionName(schema)}() {\nreturn `);
            this.schema(schema);
            this.appendTemp(';\n}\n\n');
        }
    }
}
