import type {
  AppFeatureBoardViewContext,
  AppFeatureItemViewContext,
} from "monday-sdk-js/types/client-context.type";
import { monday } from "./sdk.ts";
import { renderBoardView } from "./views/board-view.ts";
import { renderItemView } from "./views/item-view.ts";

const root = document.querySelector<HTMLDivElement>("#app")!;

const { data: ctx } = await monday.get("context");

// The SDK types give no discriminant, so the app has to cast.
if ("boardViewId" in ctx) {
  renderBoardView(root, ctx as AppFeatureBoardViewContext);
} else {
  renderItemView(root, ctx as AppFeatureItemViewContext);
}
