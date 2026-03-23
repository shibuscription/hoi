const rawGoogleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const rawGoogleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

export const env = {
  googleMapsApiKey: rawGoogleMapsApiKey?.trim() ?? "",
  googleMapsMapId: rawGoogleMapsMapId?.trim() ?? "",
};

export const envStatus = {
  hasGoogleMapsApiKey: env.googleMapsApiKey.length > 0,
  hasGoogleMapsMapId: env.googleMapsMapId.length > 0,
};

export function getGoogleMapsApiKey(): string | null {
  return envStatus.hasGoogleMapsApiKey ? env.googleMapsApiKey : null;
}

export function getGoogleMapsMapId(): string | null {
  return envStatus.hasGoogleMapsMapId ? env.googleMapsMapId : null;
}

export function getGoogleMapsSetupMessage(): string {
  if (!envStatus.hasGoogleMapsApiKey) {
    return "Google Maps API key is not configured";
  }

  return envStatus.hasGoogleMapsMapId
    ? "Google Maps API / Map ID configured"
    : "Google Maps API configured";
}
