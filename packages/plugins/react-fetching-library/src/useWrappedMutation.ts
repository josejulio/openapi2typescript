import { ValidateRule } from 'openapi2typescript';
import { useMutation as useMutationRFL } from 'react-fetching-library';
import { ActionCreator, useResponseWrapper, useWrapQueryCall } from './Utils';

export const useWrappedMutation = <Type, Params = void>(actionCreator: ActionCreator<Params>, rules: ReadonlyArray<ValidateRule>) => {
    const response = useMutationRFL(actionCreator);
    const validatedResponse = useResponseWrapper<Type>(response, rules);
    const query = useWrapQueryCall<Type, Params>(response.mutate, rules);

    return {
        loading: response.loading,
        abort: response.abort,
        headers: response.headers,
        reset: response.reset,
        ...validatedResponse,
        mutate: query
    };
};
