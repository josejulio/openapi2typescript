import { validatedResponse, validationResponseTransformer } from '../../src';

describe('core/ValidatedResponse.test.ts', () => {
    it('validationResponseTransformer is an identity function', () => {
        const fn = jest.fn();
        expect(validationResponseTransformer(fn)).toEqual(fn);
    });

    it('validatedResponse returns an object with the params passed', () => {
        expect(validatedResponse('foo', 200, 'bar', {})).toEqual({
            type: 'foo',
            status: 200,
            value: 'bar',
            errors: {}
        });
    });
});
