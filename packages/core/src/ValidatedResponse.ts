import * as z from 'zod';

export interface ValidatedResponse<Type extends string, Status extends number | undefined, ValueType> {
    type: Type,
    status: Status;
    value: ValueType;
    errors: Record<number, Array<z.ZodError>>;
}

export class ValidateRule {
    readonly zod: z.ZodTypeAny;
    readonly type: string;
    readonly status: number;

    constructor(zod: z.ZodTypeAny, type: string, status: number) {
        this.zod = zod;
        this.type = type;
        this.status = status;
    }

    public toJSON() {
        return {
            type: this.type,
            status: this.status
        };
    }

}

export const validatedResponse = <
    Name extends string,
    Status extends number | undefined,
    Value
    >(name: Name, status: Status, value: Value, errors: Record<number, Array<z.ZodError>>): ValidatedResponse<Name, Status, Value> => ({
        type: name,
        status,
        value,
        errors
    });

export const validationResponseTransformer = <
    I,
    M extends ValidatedResponse<string, number | undefined, unknown>
    >(x: (response: I) => M) => x;
