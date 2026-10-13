// Ways an app would import the SDK's context types.

// TS2614 everywhere: index.d.ts exports only `MondayClientSdk`.
import type { AppFeatureBoardViewContext } from "monday-sdk-js";

// Resolves under `bundler`. TS2307 under `nodenext`: ESM resolution needs a file extension,
// and the package has no `exports` map to provide one.
import type { AppFeatureItemViewContext } from "monday-sdk-js/types/client-context.type";

// Resolves under both, by naming `client-context.type.js`, which is not in the package.
// TypeScript maps the `.js` specifier to the shipped `.ts` source.
import type { AppFeatureObjectContext } from "monday-sdk-js/types/client-context.type.js";

export type ImportedContexts = [AppFeatureBoardViewContext, AppFeatureItemViewContext, AppFeatureObjectContext];
