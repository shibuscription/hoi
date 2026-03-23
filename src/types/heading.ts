export type HeadingSource = "street-view" | "fallback";

export type ConfirmedHeadingState = {
  heading: number | null;
  source: HeadingSource | null;
};
