import { Action, useQuery as useQueryRFL } from 'react-fetching-library';
import { ValidateRule } from 'openapi2typescript';
import { useResponseWrapper, useWrapQueryCall } from './Utils';

export const useWrappedQuery = <Type>(action: Action<unknown>, rules: ReadonlyArray<ValidateRule>, initFetch?: boolean) => {
    const response = useQueryRFL(action, initFetch);
    const validatedResponse = useResponseWrapper<Type>(response, rules);
    const query = useWrapQueryCall<Type>(response.query, rules);

    return {
        loading: response.loading,
        abort: response.abort,
        headers: response.headers,
        reset: response.reset,
        ...validatedResponse,
        query
    };
};
