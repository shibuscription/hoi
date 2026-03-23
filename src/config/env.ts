const rawGoogleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const env = {
  googleMapsApiKey: rawGoogleMapsApiKey?.trim() ?? "",
};

export const envStatus = {
  hasGoogleMapsApiKey: env.googleMapsApiKey.length > 0,
};

export function getGoogleMapsApiKey(): string | null {
  return envStatus.hasGoogleMapsApiKey ? env.googleMapsApiKey : null;
}

export function getGoogleMapsSetupMessage(): string {
  return envStatus.hasGoogleMapsApiKey
    ? "Google Maps API キー設定済み"
    : "Google Maps API キー未設定";
}
