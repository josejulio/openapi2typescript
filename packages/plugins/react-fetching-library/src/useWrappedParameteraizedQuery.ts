import { ValidateRule } from 'openapi2typescript';
import { useParameterizedQuery as useParameterizedQueryRFL } from 'react-fetching-library';
import { ActionCreator, useResponseWrapper, useWrapQueryCall } from './Utils';

export const useWrappedParameterizedQuery = <Type, Params = void>(actionCreator: ActionCreator<Params>, rules: ReadonlyArray<ValidateRule>) => {
    const response = useParameterizedQueryRFL(actionCreator);
    const validatedResponse = useResponseWrapper<Type>(response, rules);
    const query = useWrapQueryCall<Type, Params>(response.query, rules);

    return {
        loading: response.loading,
        abort: response.abort,
        headers: response.headers,
        reset: response.reset,
        ...validatedResponse,
        query
    };
};
