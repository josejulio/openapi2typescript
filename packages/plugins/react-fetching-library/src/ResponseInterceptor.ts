import { Action, QueryResponse, ResponseInterceptor } from 'react-fetching-library';
import * as z from 'zod';
import { validatedResponse, ValidateRule } from 'openapi2typescript';

export interface ActionValidatableConfig {
    rules: Array<ValidateRule>;
}

type ActionWithRequiredConfig =
    Required<Pick<Action<any, ActionValidatableConfig>, 'config'>>
    & Omit<Action<any, ActionValidatableConfig>, 'config'>;

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

const logError = (action: ActionWithRequiredConfig, response: QueryResponse<unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
        if (suppressErrorCount > 0) {
            suppressErrorCount--;
            return;
        }

        const request = `${action.method.toUpperCase()}: ${action.endpoint}`;
        console.error(
            `All validations failed for request ${request}`,
            'with:\nrequest body:', action.body,
            '\nresponse status:', response.status,
            '\nresponse body:', response.payload,
            '\nerrors:', response.error
        );
    }
};

const validateSchema =
    (
        action: ActionWithRequiredConfig,
        response: QueryResponse<unknown>
    ) => {
        const errors: Record<number, Array<z.ZodError>> = {};
        const rules = action.config.rules;
        for (const rule of rules) {
            if (rule.status === response.status) {
                const result = rule.zod.safeParse(response.payload);
                if (result.success) {
                    return validatedResponse(
                        rule.type,
                        rule.status,
                        result.data,
                        errors
                    );
                } else {
                    if (!errors[rule.status]) {
                        errors[rule.status] = [];
                    }

                    errors[rule.status].push(result.error);
                }
            }
        }

        logError(action, response);

        return validatedResponse(
            'undefined',
            undefined,
            response.payload,
            errors
        );
    };

export const validateSchemaResponseInterceptor: ResponseInterceptor<any, any> = _client => async (action, response) => {
    if (action.config?.rules) {
        const r = validateSchema(action as ActionWithRequiredConfig, response);
        response.payload = r;
        return response;
    }

    return response;
};
