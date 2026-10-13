# monday-sdk-js TypeScript reproduction

Reproduction for [mondaycom/monday-sdk-js#179](https://github.com/mondaycom/monday-sdk-js/issues/179).

This is an unmodified `npm create vite@9.2.1 -- --template vanilla-ts` app with `monday-sdk-js@1.0.0-beta` installed and two simple views: a board view and an item view. TypeScript is 6.0.3.

```sh
npm install
npm run build             # fails: SDK type files break the default Vite tsconfig
npm run build:workaround  # passes: same app with two compiler options turned off
npm run check:typings     # fails: each error is a mistake the SDK typings let through
```

## `npm run build`

The default Vite tsconfig sets `verbatimModuleSyntax` and `erasableSyntaxOnly`. The SDK ships its types as `.ts` files, so TypeScript compiles them under the app's options, and `skipLibCheck: true` does not exclude them.

```
node_modules/monday-sdk-js/types/client-context.type.ts(1,10): error TS1484: 'Theme' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
node_modules/monday-sdk-js/types/client-data.interface.ts(1,10): error TS1484: 'AppFeatureContextMap' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
node_modules/monday-sdk-js/types/client-data.interface.ts(1,32): error TS1484: 'AppFeatureTypes' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
node_modules/monday-sdk-js/types/client-sdk.interface.ts(1,10): error TS1484: 'ClientData' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
node_modules/monday-sdk-js/types/client-sdk.interface.ts(2,10): error TS1484: 'ClientExecute' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
node_modules/monday-sdk-js/types/client-sdk.interface.ts(3,10): error TS1484: 'ClientApi' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
node_modules/monday-sdk-js/types/theme-config.type.ts(4,13): error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
node_modules/monday-sdk-js/types/theme-config.type.ts(14,13): error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.
```

None of the errors are in `src/`. `npm run build:workaround` uses `tsconfig.workaround.json`, which turns both options off, and builds the same code without errors.

## `npm run check:typings`

`type-tests/silent-errors.ts` contains calls that should be type errors. TypeScript reports each `@ts-expect-error` that went unused because the SDK accepted the call:

```
type-tests/silent-errors.ts(11,3): error TS2578: Unused '@ts-expect-error' directive.   get("contxt")
type-tests/silent-errors.ts(14,3): error TS2578: Unused '@ts-expect-error' directive.   execute("notice", { mesage: 1 })
type-tests/silent-errors.ts(17,3): error TS2578: Unused '@ts-expect-error' directive.   execute("nonsense")
type-tests/silent-errors.ts(23,9): error TS2322: Type 'true' is not assignable to type 'false'.   get<{ level: number }>("settings") does not return { level: number }
```

## The views

`src/main.ts` shows what an app running as more than one feature has to do today:
- Deep-import the context types from `monday-sdk-js/types/client-context.type`, because `index.d.ts` does not export them.
- Check for a feature-specific key, because the context types have no discriminant.
- Cast `get("context")` to the feature's context type.
