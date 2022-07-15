import { Action, QueryResponse } from 'react-fetching-library';
import { useCallback, useMemo } from 'react';
import { ValidateRule } from 'openapi2typescript';
import { validateResponse } from './Validation';

export type ActionCreator<T = void> = T extends void ? () => Action<unknown> : (params: T) => Action<unknown>;

export const useWrapQueryCall = <Type, Params = void>(
    query: (params: Params) => Promise<QueryResponse<unknown>>, rules: ReadonlyArray<ValidateRule>
) => {
    return useCallback((params: Params) => {
        return query(params).then(r => validateResponse(rules, r) as unknown as Type);
    }, [ query ]);
};

export const useResponseWrapper = <Type>(response: QueryResponse<unknown>, rules: ReadonlyArray<ValidateRule>) => {
    return useMemo(() => {
        return validateResponse(rules, response) as unknown as Type;
    }, [ response ]);
};
