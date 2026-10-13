import type { AppFeatureBoardViewContext } from "monday-sdk-js/types/client-context.type";

export function renderBoardView(root: HTMLElement, ctx: AppFeatureBoardViewContext): void {
  root.textContent = `Board view ${ctx.boardViewId} on board ${ctx.boardId}`;
}
