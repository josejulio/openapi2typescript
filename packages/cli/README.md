# openapi2typescript-cli

Command line utility to generate [zod](https://github.com/vriad/zod) schemas from an OpenApi schema.
These shemas do not only help to have a "typed" response, but they can ensure (by running a validation) that you actually
got the type you are expecting.

Despite its name, you can also use it in plain `js` for running the validations (i.e. skip the types generation).

## Installing
You can either install `openapi2typescript-cli` package as a dev-dependency or run it using `npx`. You are also required to
install `openapi2typescript` as a dependency, as the generated code makes use of that library in most of the cases.

```bash
npm install openapi2typescript
npx openapi2typescript-cli 
```

## Usage
To use, you must run the binary `npm run openapi2typescript` or with npx `npx openapi2typescript-cli `.
You must specify the input file or url to the openapi and the output file, see the [Options](#Options) for more info.

You can see the lib usage at: [openapi2typescript](../core/README.md)

## Options

### --input <input>
URL or local path to an openapi.json file. If using URL, the `Accept: application/json` will be provided in the request.

### --output <output>
Output file or path to place the result. If using a directory, a file `Generated.ts` will be created there.

### --skip-post-process
Skips the post process which `prettier` and `eslint` on the output.

### --action-generator <action-generator>
Complementary code to help hook into a third party library, at the moment only 
[react-fetching-library](https://github.com/marcin-piela/react-fetching-library) is supported, but more are welcome.

Default: none

#### none
Does not generate any other code.

#### react-fetching-library
Generates action generators for react-fetching-library

### --add-eslint-disable
Convenient method to disable eslint on the file. i.e. it adds `/* eslint-disable */` on top of the file.

### --skip-types
Prevent Typescript types from appearing in the output, so that the output is js-friendly.

### --no-strict
Use the `nonstrict` checking behavior of [zod](https://github.com/vriad/zod) for all the objects.

### --explicit-types (EXPERIMENTAL)

By default, zod will fail if an object comes with extra properties. With this flag, it won't fail if there are extra
properties.

## Example

Given the following example:
```openapi.json
{
  "openapi" : "3.0.3",
  "info" : {
    "title" : "Generated API",
    "version" : "1.0"
  },
  "paths" : {
    "/fruits" : {
      "get" : {
        "responses" : {
          "200" : {
            "description" : "OK",
            "content" : {
              "application/json" : {
                "schema" : {
                  "$ref" : "#/components/schemas/SetFruit"
                }
              }
            }
          }
        }
      },
      "post" : {
        "requestBody" : {
          "content" : {
            "application/json" : {
              "schema" : {
                "$ref" : "#/components/schemas/Fruit"
              }
            }
          }
        },
        "responses" : {
          "200" : {
            "description" : "OK",
            "content" : {
              "application/json" : {
                "schema" : {
                  "$ref" : "#/components/schemas/SetFruit"
                }
              }
            }
          }
        }
      },
      "delete" : {
        "requestBody" : {
          "content" : {
            "application/json" : {
              "schema" : {
                "$ref" : "#/components/schemas/Fruit"
              }
            }
          }
        },
        "responses" : {
          "200" : {
            "description" : "OK",
            "content" : {
              "application/json" : {
                "schema" : {
                  "$ref" : "#/components/schemas/SetFruit"
                }
              }
            }
          },
          "400" : {
            "description" : "Error",
            "content" : {
              "application/json" : {
                "schema" : {
                  "$ref" : "#/components/schemas/Message"
                }
              }
            }
          }
        }
      }
    }
  },
  "components" : {
    "schemas" : {
      "Fruit" : {
        "type" : "object",
        "properties" : {
          "description" : {
            "type" : "string"
          },
          "name" : {
            "type" : "string"
          }
        }
      },
      "Message" : {
        "type" : "object",
        "properties" : {
          "description" : {
            "type" : "string"
          }
        }
      },
      "SetFruit" : {
        "uniqueItems" : true,
        "type" : "array",
        "items" : {
          "$ref" : "#/components/schemas/Fruit"
        }
      }
    }
  }
}
```

Here are some results testing different flags:

### Only required arguments:

```bash
npx -i openapi.json -o result.ts
```

```typescript
/**
 * Generated code, DO NOT modify directly.
 */
import * as z from 'zod';

export const Fruit = zodSchemaFruit();
export type Fruit = z.infer<typeof Fruit>;

export const Message = zodSchemaMessage();
export type Message = z.infer<typeof Message>;

export const SetFruit = zodSchemaSetFruit();
export type SetFruit = z.infer<typeof SetFruit>;

export function zodSchemaFruit() {
    return z.object({
        description: z.string().optional().nullable(),
        name: z.string().optional().nullable()
    });
}

export function zodSchemaMessage() {
    return z.object({
        description: z.string().optional().nullable()
    });
}

export function zodSchemaSetFruit() {
    return z.array(Fruit);
}
```

### With --action-generator react-fetching-library
```bash
npx -i openapi.json -o result.ts --action-generator react-fetching-library
```

```typescript
/**
 * Generated code, DO NOT modify directly.
 */
import * as z from 'zod';
import { ValidatedResponse } from 'openapi2typescript';
import { Action } from 'react-fetching-library';
import {
    actionBuilder,
    ActionValidatableConfig
} from 'openapi2typescript/react-fetching-library';

export const Fruit = zodSchemaFruit();
export type Fruit = z.infer<typeof Fruit>;

export const Message = zodSchemaMessage();
export type Message = z.infer<typeof Message>;

export const SetFruit = zodSchemaSetFruit();
export type SetFruit = z.infer<typeof SetFruit>;

// GET /fruits
export type GetFruitsPayload =
  | ValidatedResponse<'SetFruit', 200, SetFruit>
  | ValidatedResponse<'unknown', undefined, unknown>;
export type ActionGetFruits = Action<GetFruitsPayload, ActionValidatableConfig>;
export const actionGetFruits = (): ActionGetFruits => {
    const path = '/fruits';
    const query = {} as Record<string, any>;
    return actionBuilder('GET', path)
    .queryParams(query)
    .config({
        rules: [{ status: 200, zod: SetFruit, type: 'SetFruit' }]
    })
    .build();
};

// POST /fruits
export interface PostFruits {
  body: Fruit;
}

export type PostFruitsPayload =
  | ValidatedResponse<'SetFruit', 200, SetFruit>
  | ValidatedResponse<'unknown', undefined, unknown>;
export type ActionPostFruits = Action<
  PostFruitsPayload,
  ActionValidatableConfig
>;
export const actionPostFruits = (params: PostFruits): ActionPostFruits => {
    const path = '/fruits';
    const query = {} as Record<string, any>;
    return actionBuilder('POST', path)
    .queryParams(query)
    .data(params.body)
    .config({
        rules: [{ status: 200, zod: SetFruit, type: 'SetFruit' }]
    })
    .build();
};

// DELETE /fruits
export interface DeleteFruits {
  body: Fruit;
}

export type DeleteFruitsPayload =
  | ValidatedResponse<'SetFruit', 200, SetFruit>
  | ValidatedResponse<'Message', 400, Message>
  | ValidatedResponse<'unknown', undefined, unknown>;
export type ActionDeleteFruits = Action<
  DeleteFruitsPayload,
  ActionValidatableConfig
>;
export const actionDeleteFruits = (
    params: DeleteFruits
): ActionDeleteFruits => {
    const path = '/fruits';
    const query = {} as Record<string, any>;
    return actionBuilder('DELETE', path)
    .queryParams(query)
    .data(params.body)
    .config({
        rules: [
            { status: 200, zod: SetFruit, type: 'SetFruit' },
            { status: 400, zod: Message, type: 'Message' }
        ]
    })
    .build();
};

export function zodSchemaFruit() {
    return z.object({
        description: z.string().optional().nullable(),
        name: z.string().optional().nullable()
    });
}

export function zodSchemaMessage() {
    return z.object({
        description: z.string().optional().nullable()
    });
}

export function zodSchemaSetFruit() {
    return z.array(Fruit);
}
```

### --skip-types
```bash
npx -i openapi.json -o result.js --skip-types
```

```js
/**
 * Generated code, DO NOT modify directly.
 */
import * as z from 'zod';

export const Fruit = zodSchemaFruit();

export const Message = zodSchemaMessage();

export const SetFruit = zodSchemaSetFruit();

export function zodSchemaFruit() {
    return z.object({
        description: z.string().optional().nullable(),
        name: z.string().optional().nullable()
    });
}

export function zodSchemaMessage() {
    return z.object({
        description: z.string().optional().nullable()
    });
}

export function zodSchemaSetFruit() {
    return z.array(Fruit);
}
```

### --explicit-types
```bash
npx -i openapi.json -o result.ts --explicit-types
```

```typescript
/**
 * Generated code, DO NOT modify directly.
 */
import * as z from 'zod';

export const Fruit = zodSchemaFruit();
export type Fruit = {
  description?: string | undefined | null;
  name?: string | undefined | null;
};

export const Message = zodSchemaMessage();
export type Message = {
  description?: string | undefined | null;
};

export const SetFruit = zodSchemaSetFruit();
export type SetFruit = Array<Fruit>;

export function zodSchemaFruit() {
    return z.object({
        description: z.string().optional().nullable(),
        name: z.string().optional().nullable()
    });
}

export function zodSchemaMessage() {
    return z.object({
        description: z.string().optional().nullable()
    });
}

export function zodSchemaSetFruit() {
    return z.array(Fruit);
}
```

### --action-generator react-fetching-library --skip-types
```bash
npx -i openapi.json -o result.js --action-generator react-fetching-library --skip-types
```

```js
/**
 * Generated code, DO NOT modify directly.
 */
import * as z from 'zod';
import { actionBuilder } from 'openapi2typescript/react-fetching-library';

export const Fruit = zodSchemaFruit();

export const Message = zodSchemaMessage();

export const SetFruit = zodSchemaSetFruit();

// GET /fruits
export const actionGetFruits = () => {
    const path = '/fruits';
    const query = {};
    return actionBuilder('GET', path)
    .queryParams(query)
    .config({
        rules: [{ status: 200, zod: SetFruit, type: 'SetFruit' }]
    })
    .build();
};

// POST /fruits
/*
 Params
body: Fruit
*/
export const actionPostFruits = (params) => {
    const path = '/fruits';
    const query = {};
    return actionBuilder('POST', path)
    .queryParams(query)
    .data(params.body)
    .config({
        rules: [{ status: 200, zod: SetFruit, type: 'SetFruit' }]
    })
    .build();
};

// DELETE /fruits
/*
 Params
body: Fruit
*/
export const actionDeleteFruits = (params) => {
    const path = '/fruits';
    const query = {};
    return actionBuilder('DELETE', path)
    .queryParams(query)
    .data(params.body)
    .config({
        rules: [
            { status: 200, zod: SetFruit, type: 'SetFruit' },
            { status: 400, zod: Message, type: 'Message' }
        ]
    })
    .build();
};

export function zodSchemaFruit() {
    return z.object({
        description: z.string().optional().nullable(),
        name: z.string().optional().nullable()
    });
}

export function zodSchemaMessage() {
    return z.object({
        description: z.string().optional().nullable()
    });
}

export function zodSchemaSetFruit() {
    return z.array(Fruit);
}
```
