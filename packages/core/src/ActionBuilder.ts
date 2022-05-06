interface HasToString {
    toString: () => string;
}

type HasToStringOrUndefined = HasToString | Array<HasToString> | undefined;
export type QueryParamsType = Record<string, HasToStringOrUndefined>;

export type Method = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export abstract class ActionBuilder<T> {
    protected readonly _method: Method;
    protected readonly _url: string;
    protected _queryParams?: QueryParamsType;
    protected _data?: unknown;
    protected _config: any;

    public constructor(method: Method, url: string) {
        this._method = method;
        this._url = url;
    }

    public abstract build(): T;

    public queryParams(queryParams?: QueryParamsType) {
        this._queryParams = queryParams;
        return this;
    }

    public data(data?: unknown) {
        this._data = data;
        return this;
    }

    public config(config: any) {
        this._config = config;
        return this;
    }

    protected getMethod() {
        return this._method;
    }

    protected getUrl() {
        return this._url;
    }

    protected getQueryParams() {
        return this._queryParams;
    }

    protected getData() {
        return this._data;
    }

    protected buildQueryString() {
        const parsedURL = new URL(this.getUrl(), 'http://dummybase');
        const querySeparator = parsedURL.searchParams.toString() === '' ? '?' : '&';
        const queryParams = this.getQueryParams();

        if (queryParams) {
            const queryString = this.urlSearchParams(queryParams).toString();
            if (queryString !== '') {
                return querySeparator + queryString;
            }
        }

        return '';
    }

    protected urlSearchParams(params: QueryParamsType): URLSearchParams {
        const searchParams = new URLSearchParams();

        for (const [ key, value ] of Object.entries(params)) {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v.toString()));
                } else {
                    searchParams.append(key, value.toString());
                }
            }
        }

        return searchParams;
    }
}
