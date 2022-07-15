import { validationResponseWrapper, validationResponseTransformer } from '../../src';

describe('core/ValidatedResponse.test.ts', () => {
    it('validationResponseTransformer is an identity function', () => {
        const fn = jest.fn();
        expect(validationResponseTransformer(fn)).toEqual(fn);
    });

    it('validatedResponse returns an object with the params passed', () => {
        expect(validationResponseWrapper({
            type: 'foo',
            status: 200,
            value: 'bar',
            errors: {},
            hasErrors: false,
            rawErrors: undefined
        })).toEqual({
            type: 'foo',
            status: 200,
            value: 'bar',
            errors: {},
            hasErrors: false,
            rawErrors: undefined
        });
    });
});
