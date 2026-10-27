import type { LngLatLike } from 'mapbox-gl';

export const mapConfig = {
  center: [-84.388, 33.749] as LngLatLike,
  zoom: 10.3,
  style: 'mapbox://styles/mapbox/streets-v12',
};

// Full URL for a file in /public. BASE_URL is '/' locally and '/Georgia-pantry-map/' on GitHub Pages;
// absolute because Mapbox fetches GeoJSON from a web worker, where relative paths don't resolve.
export const dataUrl = (file: string) => new URL(import.meta.env.BASE_URL + file, window.location.origin).href;
