import type { LngLatLike } from 'mapbox-gl';

export const mapConfig = {
  // Opens on the Atlanta view, centred on the city limits
  center: [-84.42, 33.768] as LngLatLike,
  zoom: 10.6,
  style: 'mapbox://styles/mapbox/streets-v12',
};

// Full URL for a file in /public. BASE_URL is '/' locally and '/Georgia-pantry-map/' on GitHub Pages;
// absolute because Mapbox fetches GeoJSON from a web worker, where relative paths don't resolve.
export const dataUrl = (file: string) => new URL(import.meta.env.BASE_URL + file, window.location.origin).href;
