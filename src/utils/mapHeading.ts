import type { MapOrientationMode } from "../types";

export function normalizeHeading(heading: number | null | undefined) {
  if (typeof heading !== "number" || !Number.isFinite(heading)) {
    return null;
  }

  const normalized = heading % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function getMapRotationDegrees(
  orientationMode: MapOrientationMode,
  confirmedHeading: number | null,
) {
  if (orientationMode === "heading-up" && confirmedHeading !== null) {
    return confirmedHeading;
  }

  return 0;
}
