import { useEffect, useRef } from 'react';
import { dataUrl } from '../config';
import type { GeoJSONSource, LngLatBoundsLike, Map } from 'mapbox-gl';

export type FocusArea = 'georgia' | 'atlanta';

export const focusAreas: { key: FocusArea; label: string; mask: string; outline: string; bounds: LngLatBoundsLike }[] = [
  { key: 'georgia', label: 'Georgia', mask: dataUrl('outside_georgia_mask.geojson'), outline: dataUrl('georgia.geojson'), bounds: [-85.61, 30.36, -80.84, 35.0] },
  { key: 'atlanta', label: 'Atlanta', mask: dataUrl('outside_atlanta_mask.geojson'), outline: dataUrl('atlanta_city_limits.geojson'), bounds: [-84.551, 33.648, -84.29, 33.887] },
];

interface AreaFocusProps {
  map: Map;
  area: FocusArea;
}

// Fades everything outside the chosen area under a grey mask and outlines it.
// Layers added after this one (city outline, pantry dots) stay fully visible on top.
export function AreaFocus({ map, area }: AreaFocusProps) {
  useEffect(() => {
    // Start with the area the app opens in; later switches go through setData below
    const start = focusAreas.find((f) => f.key === area) ?? focusAreas[0];
    map.addSource('outside-area', { type: 'geojson', data: start.mask });
    map.addSource('area', { type: 'geojson', data: start.outline });
    map.addLayer({
      id: 'outside-area-mask',
      type: 'fill',
      source: 'outside-area',
      paint: { 'fill-color': '#d4d4d4', 'fill-opacity': 0.85 },
    });
    map.addLayer({
      id: 'area-outline',
      type: 'line',
      source: 'area',
      paint: { 'line-color': '#555', 'line-width': 1.5 },
    });

    return () => {
      if (map.getStyle()) {
        map.removeLayer('area-outline');
        map.removeLayer('outside-area-mask');
        map.removeSource('area');
        map.removeSource('outside-area');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const shownArea = useRef(area);
  useEffect(() => {
    const a = focusAreas.find((f) => f.key === area) ?? focusAreas[0];
    (map.getSource('outside-area') as GeoJSONSource).setData(a.mask);
    (map.getSource('area') as GeoJSONSource).setData(a.outline);
    // Keep the configured opening view; zoom only when the user switches area
    if (shownArea.current === area) return;
    shownArea.current = area;
    map.fitBounds(a.bounds, { padding: 40 });
  }, [map, area]);

  return null;
}
