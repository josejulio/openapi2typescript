import { ActionBuilder, Method } from 'openapi2typescript';
import { Action } from 'react-fetching-library';

export class ReactFetchingLibraryActionBuilder extends ActionBuilder<Action> {
    public build(): Action {
        const endpoint = this.getUrl() + this.buildQueryString();

        return {
            method: this.getMethod(),
            endpoint,
            body: this.getData(),
            config: this._config
        };
    }
}

export const actionBuilder = (method: Method, url: string) =>
    new ReactFetchingLibraryActionBuilder(method, url);
