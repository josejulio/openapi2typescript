# openapi2typescript

Supporting lib for [openapi2typescript-cli](../../cli/README.md).

# Installing
See [openapi2typescript-cli](../../cli/README.md)

# Usage

Once you have this library installed and your schema generated you can use this library to connect your request library
and start validating. Currently only [react-fetching-library](https://github.com/marcin-piela/react-fetching-library) is 
supported, but more are welcome.

## Using without connecting
You can directly given the [example](../../cli/README.md#Example) on the cli README you can import the
types directly and use them to run your validations when you get the data.

```typescript
import { Fruit } from 'cli-output.ts';

// ... server response is in payload

const result = Fruit.safeParse(payload);
if (result.success) {
    // result.data has the validated type
} else {
    // result.error contains the error
}
```

You can check more information on how to use these types at [zod](https://github.com/vriad/zod).

## Connecting with react-fetching-library
To properly connect, you have pass the `validateSchemaResponseInterceptor` to the list of response interceptors when
creating the client:

```typescript
import { createClient } from 'react-fetching-library';
import { validateSchemaResponseInterceptor } from 'openapi2typescript/react-fetching-library';

const client = createClient({
    responseInterceptors: [ validateSchemaResponseInterceptor ]
});

// Then you can pass this client to the ClientContextProvider (as you would normally do)
```

Now all the queries will yield a `ValidatedResponse` that has the `type`, `status`, `value` and errors found. This response
will take into account all the possible values that the query could return (depending on their openapi spec).

If all the options are exhausted, a `console.error` will happen with the information.

Going back to our [example](../../cli/README.md#Example) we can see that our `DELETE` endpoint
returns on status 200 a SetFruit and on status 400 a Message. Given that, we can do the following:

```typescript
import { Fruit } from 'cli-output.ts';

// Inside the React component
const mutation = useMutation(actionDeleteFruits);

// Inside a click handler or similar?
const response = await mutation.mutate({
  body: {
    name: 'Apple',
    description: 'Yummy'
  }
}); 
if (response.payload?.type === 'SetFruit') {
  // type is SetFruit, this means that the validation succeded for this type (of all the possible responses for this call)
  // Our value is on response.payload.value
} else {
  // type is something else, in this particular case it means it could be a "Message" or "unknown" (none of the know responses)
  if (response.payload?.type === 'Message') {
  } else {
    // No other options for this query... We could process this as unknown error. And actually IT IS, the openapi didn't 
    // yield other options.
  }
}

// We can also check by the status, but always the status of the payload.
if (response.payload?.status === 200) {
  // status is 200, for this query, it means that the type is a SetFruit
} else if (response.payload?.status === 400) {
  // status 400 means a Message
} else {
  // Something else... response.payload?.type === 'unknown' and response.payload?.status is undefined.
  // All validations failed
}
```

# More

## Transform ValidatedResponse

Some helpers are provided (`validatedResponse` and `validationResponseTransformer`) to help you transform your 
`ValidatedResponse`, use cases of this is if you want to parse some received data to a more specific data.
If not done correctly, you could lose the type safety of the `status` and `type` as they will be cast to `any` or 
`string`.

One way to correctly transform them is as follows:

```typescript
import { validatedResponse, validationResponseTransformer } from 'openapi2typescript';
// Response is a concrete type of ValidatedResponse

const transformResponse = validationResponseTransformer((r: Response) => {
  if (r.type === 'RawFooBar') {
    return validatedResponse(
      'FooBar',
       r.status,
       transformRawFooBarToFooBar(r.value),
       r.errors
    );
  }

  return r;
});
```

With this, the value return from `transformResponse` will replace the type `RawFooBar` with `FooBar` without changing 
anything else and updating the type correctly.

## Suppress errors

Every time all the options fail to validate when using the `react-fetching-library` plugin, a console.error will happen 
with useful info to know what happened. If using alongside tests, this could be noisy, that's why a `suppressValidateError`
function is provided to knowingly suppress the specified number of times.
