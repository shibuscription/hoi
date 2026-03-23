import type {
  GoogleMapsCoordinates,
  GoogleMapsMapUrlOptions,
  GoogleMapsStreetViewUrlOptions,
} from "../types/googleMaps";
import { normalizeHeading } from "./mapHeading";

export const GOOGLE_MAPS_URL_DEFAULTS = {
  mapZoom: 18,
  streetViewPitch: 0,
  streetViewFov: 80,
} as const;

function isValidLatitude(latitude: number) {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

function isValidLongitude(longitude: number) {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function areValidCoordinates(coordinates: GoogleMapsCoordinates) {
  return isValidLatitude(coordinates.latitude) && isValidLongitude(coordinates.longitude);
}

export function buildGoogleMapsUrlForMap(options: GoogleMapsMapUrlOptions) {
  if (!areValidCoordinates(options)) {
    return null;
  }

  const zoom = Number.isFinite(options.zoom) ? String(options.zoom) : String(GOOGLE_MAPS_URL_DEFAULTS.mapZoom);
  const url = new URL("https://www.google.com/maps/@");
  url.searchParams.set("api", "1");
  url.searchParams.set("map_action", "map");
  url.searchParams.set("center", `${options.latitude},${options.longitude}`);
  url.searchParams.set("zoom", zoom);

  return url.toString();
}

export function buildGoogleMapsUrlForStreetView(options: GoogleMapsStreetViewUrlOptions) {
  if (!areValidCoordinates(options)) {
    return null;
  }

  const heading = normalizeHeading(options.heading);

  if (heading === null) {
    return null;
  }

  const url = new URL("https://www.google.com/maps/@");
  url.searchParams.set("api", "1");
  url.searchParams.set("map_action", "pano");
  url.searchParams.set("viewpoint", `${options.latitude},${options.longitude}`);
  url.searchParams.set("heading", String(Math.round(heading)));
  url.searchParams.set("pitch", String(options.pitch ?? GOOGLE_MAPS_URL_DEFAULTS.streetViewPitch));
  url.searchParams.set("fov", String(options.fov ?? GOOGLE_MAPS_URL_DEFAULTS.streetViewFov));

  return url.toString();
}
