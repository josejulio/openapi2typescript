import { suppressValidateError, validateSchemaResponseInterceptor } from '../src';

describe('src/react-fetching-library/ResponseInterceptor', () => {
    it('validateSchemaResponseInterceptor does not do anything if there is no config.rules', async () => {
        const interceptor = validateSchemaResponseInterceptor(undefined as any);
        expect(await interceptor({} as any, {
            payload: 'bar'
        } as any)).toEqual({
            payload: 'bar'
        });
    });

    it('validateSchemaResponseInterceptor wraps into a validatedResponse if there are config.rules', async () => {
        const interceptor = validateSchemaResponseInterceptor(undefined as any);

        suppressValidateError(1);
        expect(await interceptor({
            config: {
                rules: []
            }
        } as any, {
            payload: 'bar'
        } as any)).toEqual({
            payload: {
                errors: {},
                status: undefined,
                type: 'undefined',
                value: 'bar'
            }
        });
    });
});
