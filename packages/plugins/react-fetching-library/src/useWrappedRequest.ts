import { useClient } from 'react-fetching-library';
import { useCallback } from 'react';
import { ActionCreator } from './Utils';
import { ValidateRule } from 'openapi2typescript';
import { validateResponse } from './Validation';

export const useWrappedRequest = <Type, Params = void>(actionCreator: ActionCreator<Params>, rules: ReadonlyArray<ValidateRule>) => {
    const { query } = useClient();
    return useCallback((params: Params) => {
        return query(actionCreator(params))
        .then(r => validateResponse(rules, r) as unknown as Type);
    }, [ query ]);
};
