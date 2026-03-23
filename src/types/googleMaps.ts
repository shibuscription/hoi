export type GoogleMapsCoordinates = {
  latitude: number;
  longitude: number;
};

export type GoogleMapsMapUrlOptions = GoogleMapsCoordinates & {
  zoom?: number;
};

export type GoogleMapsStreetViewUrlOptions = GoogleMapsCoordinates & {
  heading: number;
  pitch?: number;
  fov?: number;
};
