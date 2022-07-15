import { ValidateRule, validationResponseWrapper } from 'openapi2typescript';
import { z } from 'zod';
import { QueryResponse } from 'react-fetching-library';

let suppressErrorCount = 0;

/**
 * Used for knowingly suppress errors while testing.
 */
export const suppressValidateError = (times?: number) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error('suppressValidateError should only be used for testing');
    }

    suppressErrorCount += times ?? 1;
};

const logError = (errors: Record<number, Array<z.ZodError>>) => {
    if (process.env.NODE_ENV !== 'production') {
        if (suppressErrorCount > 0) {
            suppressErrorCount--;
            return;
        }

        console.error(
            'Validation failed with errors',
            errors
        );
    }
};

export const validateResponse = (rules: ReadonlyArray<ValidateRule>, response: QueryResponse<unknown>) => {
    const errors: Record<number, Array<z.ZodError>> = {};
    for (const rule of rules) {
        if (rule.status === response.status) {
            const result = rule.zod.safeParse(response.payload);
            if (result.success) {
                return validationResponseWrapper(({
                    type: rule.type,
                    status: rule.status,
                    value: result.data,
                    errors: {},
                    hasErrors: false,
                    rawErrors: response.errorObject,
                    headers: response.headers
                }));
            } else {
                if (!errors[rule.status]) {
                    errors[rule.status] = [];
                }

                errors[rule.status].push(result.error);
            }
        }
    }

    logError(errors);
    return validationResponseWrapper({
        type: 'undefined',
        status: response.status,
        value: response.payload,
        errors,
        hasErrors: true,
        rawErrors: response.errorObject,
        headers: response.headers
    });
};
