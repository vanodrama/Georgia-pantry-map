import { useEffect } from 'react';
import type { Map } from 'mapbox-gl';

export const STATE_LINE_COLOR = '#8a8a8a';

interface StateBoundariesProps {
  map: Map;
}

// Restyles the Streets basemap's built-in state (admin-1) borders: thin, solid grey, no halo.
export function StateBoundaries({ map }: StateBoundariesProps) {
  useEffect(() => {
    if (map.getLayer('admin-1-boundary-bg')) map.setLayoutProperty('admin-1-boundary-bg', 'visibility', 'none');
    if (map.getLayer('admin-1-boundary')) {
      map.setLayoutProperty('admin-1-boundary', 'visibility', 'visible');
      map.setPaintProperty('admin-1-boundary', 'line-color', STATE_LINE_COLOR);
      map.setPaintProperty('admin-1-boundary', 'line-width', ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.2]);
      map.setPaintProperty('admin-1-boundary', 'line-dasharray', [1, 0]);
      map.setPaintProperty('admin-1-boundary', 'line-opacity', 0.9);
    }
  }, [map]);

  return null;
}
