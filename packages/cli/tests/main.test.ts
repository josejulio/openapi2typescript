import fetchMockJest from 'fetch-mock-jest';
import {execute} from '../src/main';
import {existsSync, mkdirSync, readFileSync} from 'fs';
import rimRaf from 'rimraf';
import fetchMock from 'node-fetch';
import {ActionGeneratorType} from '../src/core/types/ActionGeneratorType';
import * as ts from 'typescript';
import {NamingType} from "../src/core/types/NamingType";

jest.mock('node-fetch', () => fetchMockJest.sandbox());

const tsCompile = (sourceFile: string, options?: ts.TranspileOptions): string => {
    if (!options) {
        options = { compilerOptions: { module: ts.ModuleKind.CommonJS }};
    }

    const source = readFileSync(sourceFile).toString();

    return ts.transpileModule(source, options).outputText;
};

describe('src/cli/schema', () => {

    const tempSchemaDir = './tmp/schemas';

    beforeEach(() => {
        mkdirSync(tempSchemaDir, {
            recursive: true
        });
    });

    afterEach(() => {
        rimRaf.sync(tempSchemaDir);
    });

    it('naming - no case transformation', () => {
        const filename = './tests/__fixtures__/simple-openapi.json';

        return execute({
            input: filename,
            output: tempSchemaDir,
            skipPostProcess: false,
            addEslintDisable: true,
            actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
            skipTypes: false,
            strict: true,
            explicitTypes: false,
            naming: NamingType.NONE
        }).then(() => {
            expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
            expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).not.toContain('snakeCaseProp');
        });
    });

    it('naming - transforms to camel-case', () => {
        const filename = './tests/__fixtures__/simple-openapi.json';

        return execute({
            input: filename,
            output: tempSchemaDir,
            skipPostProcess: false,
            addEslintDisable: true,
            actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
            skipTypes: false,
            strict: true,
            explicitTypes: false,
            naming: NamingType.CAMEL_CASE
        }).then(() => {
            expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
            expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).toContain('snakeCaseProp');
        });
    });

    describe.each([
        './tests/__fixtures__/notifications-openapi.json',
        './tests/__fixtures__/integrations-openapi.json',
        './tests/__fixtures__/rbac-openapi.json',
        './tests/__fixtures__/policies-openapi.json',
        './tests/__fixtures__/simple-openapi.json'
    ])('execute for %s', (filename) => {

        it('execute input file accepts path', () => {
            return execute({
                input: filename,
                output: tempSchemaDir,
                skipPostProcess: false,
                addEslintDisable: true,
                actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
                skipTypes: true,
                strict: true,
                explicitTypes: false,
                naming: NamingType.NONE
            }).then(() => {
                expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();

                const compiled = tsCompile(`${tempSchemaDir}/Generated.ts`);

                expect(compiled).toBeTruthy();
                expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).toMatchSnapshot('generated');
                expect(compiled).toMatchSnapshot('compiled');
            });
        });

        it('use any z.infer if explicitTypes is false', () => {
            return execute({
                input: filename,
                output: tempSchemaDir,
                skipPostProcess: false,
                addEslintDisable: true,
                actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
                skipTypes: false,
                strict: true,
                explicitTypes: false,
                naming: NamingType.NONE
            }).then(() => {
                expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
                expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).toContain('z.infer<');
            });
        });

        it('do not use any z.infer if explicitTypes is true', () => {
            return execute({
                input: filename,
                output: tempSchemaDir,
                skipPostProcess: false,
                addEslintDisable: true,
                actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
                skipTypes: false,
                strict: true,
                explicitTypes: true,
                naming: NamingType.NONE
            }).then(() => {
                expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
                expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).not.toContain('z.infer<');
            });
        });

        it('sets objects to nonstrict if strict is false', () => {
            return execute({
                input: filename,
                output: tempSchemaDir,
                skipPostProcess: false,
                addEslintDisable: true,
                actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
                skipTypes: true,
                strict: false,
                explicitTypes: false,
                naming: NamingType.NONE
            }).then(() => {
                expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
                expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).toContain('.nonstrict()');
            });
        });

        it('do not set objects to nonstrict if strict is true', () => {
            return execute({
                input: filename,
                output: tempSchemaDir,
                skipPostProcess: false,
                addEslintDisable: true,
                actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
                skipTypes: true,
                strict: true,
                explicitTypes: false,
                naming: NamingType.NONE
            }).then(() => {
                expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
                expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).not.toContain('.nonstrict()');
            });
        });

        it('execute accepts urls', async () => {
            (fetchMock as any).get('http://foobar.baz/my-openapi.json', {
                body: readFileSync(filename).toString(),
                status: 200
            });

            return execute({
                input: 'http://foobar.baz/my-openapi.json',
                output: tempSchemaDir,
                addEslintDisable: true,
                skipPostProcess: false,
                skipTypes: false,
                actionGenerator: ActionGeneratorType.REACT_FETCHING_LIBRARY,
                strict: true,
                explicitTypes: false,
                naming: NamingType.NONE
            }).then(() => {
                (fetchMock as any).restore();
                expect(existsSync(`${tempSchemaDir}/Generated.ts`)).toBeTruthy();
                expect(readFileSync(`${tempSchemaDir}/Generated.ts`).toString()).toMatchSnapshot();
            });
        });
    });
});
