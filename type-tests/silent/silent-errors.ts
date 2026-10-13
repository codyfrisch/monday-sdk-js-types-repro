// `npm run check:typings` should pass. Every error it reports is an SDK typing problem:
// - "Unused '@ts-expect-error' directive" marks a mistake the SDK typings fail to catch.
// - The TS2322 on `isExact` means `get<T>("settings")` does not return `T`.
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export async function silentErrors(): Promise<void> {
  // @ts-expect-error misspelled get key (typed `T | string`)
  await monday.get("contxt");

  // @ts-expect-error misspelled param and wrong type (swallowed by the `any` overload)
  await monday.execute("notice", { mesage: 1 });

  // @ts-expect-error unknown execute action (swallowed by the `any` overload)
  await monday.execute("nonsense");

  // An explicit generic on `get` should make `data` exactly `{ level: number }`.
  // It is a union of every getter type intersected with it, so this check fails.
  const settings = await monday.get<{ level: number }>("settings");
  const isExact: Equals<typeof settings.data, { level: number }> = true;
  void isExact;
}
