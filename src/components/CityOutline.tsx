import { useEffect } from 'react';
import { dataUrl } from '../config';
import type { Map } from 'mapbox-gl';

export const OUTLINE_COLOR = '#1d4ed8';

interface CityOutlineProps {
  map: Map;
}

// Atlanta city limits (Census TIGER place 1304000) as a dashed outline with a faint fill.
export function CityOutline({ map }: CityOutlineProps) {
  useEffect(() => {
    map.addSource('atlanta', { type: 'geojson', data: dataUrl('atlanta_city_limits.geojson') });
    map.addLayer({
      id: 'atlanta-fill',
      type: 'fill',
      source: 'atlanta',
      paint: { 'fill-color': OUTLINE_COLOR, 'fill-opacity': 0.06 },
    });
    map.addLayer({
      id: 'atlanta-line',
      type: 'line',
      source: 'atlanta',
      paint: { 'line-color': OUTLINE_COLOR, 'line-width': 2.5, 'line-dasharray': [2, 1] },
    });

    return () => {
      if (map.getStyle()) {
        map.removeLayer('atlanta-line');
        map.removeLayer('atlanta-fill');
        map.removeSource('atlanta');
      }
    };
  }, [map]);

  return null;
}
