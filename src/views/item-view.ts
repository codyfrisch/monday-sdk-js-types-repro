import type { AppFeatureItemViewContext } from "monday-sdk-js/types/client-context.type";

export function renderItemView(root: HTMLElement, ctx: AppFeatureItemViewContext): void {
  root.textContent = `Item ${ctx.itemId} on board ${ctx.boardId}`;
}
