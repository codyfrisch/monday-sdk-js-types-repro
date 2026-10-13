# monday-sdk-js TypeScript reproduction

Reproduction for [mondaycom/monday-sdk-js#179](https://github.com/mondaycom/monday-sdk-js/issues/179).

This is an unmodified `npm create vite@9.2.1 -- --template vanilla-ts` app with `monday-sdk-js@1.0.0-beta` installed and two simple views: a board view and an item view. TypeScript is 6.0.3.

```sh
npm install
npm run build                   # fails: SDK type files break the default Vite tsconfig
npm run build:workaround        # passes: same app with two compiler options turned off
npm run check:context           # fails: get("context") / listen("context") can't be used without casting
npm run check:typings           # fails: each error is a mistake the SDK typings let through
npm run check:imports:bundler   # fails: context types can't be imported from the package root
npm run check:imports:nodenext  # fails: and the deep import doesn't resolve under nodenext
```

Each `check:*` script compiles only its own file under `type-tests/`, with `verbatimModuleSyntax` and `erasableSyntaxOnly` off, so the build errors below don't mix into their output.

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

## `npm run check:context`

`type-tests/context/context-errors.ts` reads the context the way an app running as more than one feature would:

```
type-tests/context/context-errors.ts(10,14): error TS2339: Property 'boardId' does not exist on type 'BaseContext | AppFeatureBoardViewContext | AppFeatureAiBoardMainMenuHeaderContext | ... 10 more ... | AppFeatureDocActionsContext'.
  Property 'boardId' does not exist on type 'BaseContext'.
type-tests/context/context-errors.ts(18,16): error TS2339: Property 'boardViewId' does not exist on type 'AppFeatureBoardViewContext | AppFeatureDashboardWidgetContext | AppFeatureObjectContext | AppFeatureItemViewContext'.
  Property 'boardViewId' does not exist on type 'AppFeatureDashboardWidgetContext'.
type-tests/context/context-errors.ts(26,27): error TS2339: Property 'boardId' does not exist on type 'BaseContext | AppFeatureBoardViewContext | AppFeatureAiBoardMainMenuHeaderContext | ... 10 more ... | AppFeatureDocActionsContext'.
  Property 'boardId' does not exist on type 'BaseContext'.
```

- **Line 10.** `get("context")` returns a union of all 14 context types, so only `BaseContext` fields are reachable.
- **Line 18.** `instanceType` is typed `string` on every context that has it. Checking `ctx.instanceType === "board_view"` narrows nothing.
- **Line 26.** `listen("context")` returns the same union.
- **`featureHintIsUnchecked`.** This compiles, and that is the problem. `get("context", { appFeatureType: "AppFeatureBoardView" })` types `boardViewId` as `number` in every feature. The SDK forwards `appFeatureType` to the host, which ignores it, so in an item view the value is `undefined` at runtime.

## `npm run check:typings`

`type-tests/silent/silent-errors.ts` contains calls that should be type errors. TypeScript reports each `@ts-expect-error` that went unused because the SDK accepted the call:

```
type-tests/silent/silent-errors.ts(11,3): error TS2578: Unused '@ts-expect-error' directive.   get("contxt")
type-tests/silent/silent-errors.ts(14,3): error TS2578: Unused '@ts-expect-error' directive.   execute("notice", { mesage: 1 })
type-tests/silent/silent-errors.ts(17,3): error TS2578: Unused '@ts-expect-error' directive.   execute("nonsense")
type-tests/silent/silent-errors.ts(23,9): error TS2322: Type 'true' is not assignable to type 'false'.   get<{ level: number }>("settings") does not return { level: number }
```

## `npm run check:imports:bundler` and `npm run check:imports:nodenext`

`type-tests/imports/imports.ts` imports a context type three ways, under `moduleResolution: "bundler"` and `"nodenext"`:

| Import | bundler | nodenext |
|---|---|---|
| `from "monday-sdk-js"` | TS2614 | TS2614 |
| `from "monday-sdk-js/types/client-context.type"` | resolves | TS2307 |
| `from "monday-sdk-js/types/client-context.type.js"` | resolves | resolves |

`nodenext` output (`bundler` reports only the first error):

```
type-tests/imports/imports.ts(4,15): error TS2614: Module '"monday-sdk-js"' has no exported member 'AppFeatureBoardViewContext'. Did you mean to use 'import AppFeatureBoardViewContext from "monday-sdk-js"' instead?
type-tests/imports/imports.ts(8,48): error TS2307: Cannot find module 'monday-sdk-js/types/client-context.type' or its corresponding type declarations.
```

`types/index.d.ts` exports only `MondayClientSdk`, so the context types have to be deep-imported. Under `nodenext`, the only deep import that resolves names `client-context.type.js`, a file the package doesn't ship. TypeScript maps that specifier to the `.ts` source. Any deep import also pulls the `.ts` sources into the app's compilation, which causes the `npm run build` errors. With `.d.ts` files re-exported from `index.d.ts`, `import type { AppFeatureBoardViewContext } from "monday-sdk-js"` would work under every resolution mode.

## The views

`src/main.ts` shows what an app running as more than one feature has to do today:
- Deep-import the context types from `monday-sdk-js/types/client-context.type`, because `index.d.ts` does not export them.
- Check for a feature-specific key, because the context types have no discriminant.
- Cast `get("context")` to the feature's context type.
