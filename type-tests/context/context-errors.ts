// `npm run check:context` should pass. Each error is code an app running as more than one
// feature would naturally write against `get("context")` / `listen("context")`.
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

export async function readBoard(): Promise<number> {
  const { data: ctx } = await monday.get("context");
  // TS2339: `ctx` is a union of all 14 context types, so only BaseContext fields are reachable.
  return ctx.boardId;
}

export async function narrowByInstanceType(): Promise<number | undefined> {
  const { data: ctx } = await monday.get("context");
  // `instanceType` is `string` on every context that has it, so comparing it narrows nothing.
  if ("instanceType" in ctx && ctx.instanceType === "board_view") {
    // TS2339: still a union of the four contexts that declare `instanceType`.
    return ctx.boardViewId;
  }
  return undefined;
}

export function listenForBoard(): () => void {
  return monday.listen("context", res => {
    // TS2339: `listen("context")` returns the same 14-way union.
    console.info(res.data.boardId);
  });
}

export async function featureHintIsUnchecked(): Promise<number> {
  // Compiles in every feature. `appFeatureType` is a type assertion passed as a runtime argument.
  // In an item view, `boardViewId` is typed `number` and is `undefined` at runtime.
  const { data: ctx } = await monday.get("context", { appFeatureType: "AppFeatureBoardView" });
  return ctx.boardViewId;
}
