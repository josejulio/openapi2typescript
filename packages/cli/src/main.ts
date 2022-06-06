import { CLIEngine } from 'eslint';
import fetch from 'node-fetch';
import prettier from 'prettier';
import isUrl from 'is-url';
import { existsSync, lstatSync, readFileSync, writeFileSync } from 'fs';

import { buildApiDescriptor } from './core/ApiDescriptorBuilder';
import { OpenAPI3 } from './core/types/OpenAPI3';
import { ApiTypeBuilder } from './core/ApiTypeBuilder';
import { getProgram } from './cli/Program';
import { Buffer, BufferType } from './core/types/Buffer';
import { ReactFetchingLibraryApiActionBuilder } from './react-fetching-library/ApiActionBuilder';
import { ActionGeneratorType } from './core/types/ActionGeneratorType';
import { NamingType } from './core/types/NamingType';

export interface Options {
    input: string;
    output: string;
    skipPostProcess: boolean;
    actionGenerator: ActionGeneratorType;
    naming: NamingType;
    addEslintDisable: boolean;
    skipTypes: boolean;
    strict: boolean;
    explicitTypes: boolean;
    apiBasePath?: string;
}

export const execute = async (options: Options) => {

    if (options.naming !== NamingType.NONE && (options.explicitTypes || options.skipTypes)) {
        throw new Error('explicitTypes or skipTypes must be used when using a naming');
    }

    let input;

    if (isUrl(options.input)) {
        input = await fetch(options.input, {
            headers: {
                Accept: 'application/json'
            }
        }).then(res => res.text());
    } else {
        input = await readFileSync(options.input);
    }

    if (existsSync(options.output)) {
        const fileStat = lstatSync(options.output);
        if (fileStat.isDirectory()) {
            options.output = `${options.output}/Generated.ts`;
        }
    }

    return Promise.resolve<string>(input.toString())
    .then(output => JSON.parse(output) as OpenAPI3)
    .then(openapi => buildApiDescriptor(openapi, {
        nonRequiredPropertyIsNull: true,
        basePath: options.apiBasePath
    }))
    .then(descriptor => {
        const buffer = new Buffer();

        [
            '/**\n',
            '* Generated code, DO NOT modify directly.\n',
            '*/\n',
            'import * as z from \'zod\';\n'
        ].forEach(l => buffer.write(l, BufferType.HEADER));

        const typeBuilder = new ApiTypeBuilder(descriptor, buffer, options);
        typeBuilder.build();

        switch (options.actionGenerator) {
            case ActionGeneratorType.NONE:
                break;
            case ActionGeneratorType.REACT_FETCHING_LIBRARY:
                const actionBuilder = new ReactFetchingLibraryApiActionBuilder(descriptor, buffer, options);
                actionBuilder.build();
                break;
        }

        return buffer.toString();
    }).then(content => {
        if (options.skipPostProcess) {
            return content;
        }

        return prettier.format(
            content,
            {
                parser: 'typescript'
            }
        );
    }).then(async (content) => {
        return writeFileSync(options.output, content);
    });
};

if (require.main === module) {
    const program = getProgram();
    program.parse(process.argv);
    execute(program.opts() as Options);
}
