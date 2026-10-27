import { useEffect } from 'react';
import { dataUrl } from '../config';
import mapboxgl from 'mapbox-gl';
import type { FocusArea } from './AreaFocus';

export const PANTRY_COLOR = '#6a1b9a';

interface PantriesLayerProps {
  map: mapboxgl.Map;
  // Only pantries inside the chosen area are shown (precomputed `inGeorgia` / `inAtlanta` flags)
  area: FocusArea;
}

// Atlanta Community Food Bank partner locations from /food_pantries.geojson, with a popup on click.
export function PantriesLayer({ map, area }: PantriesLayerProps) {
  useEffect(() => {
    map.addSource('pantries', { type: 'geojson', data: dataUrl('food_pantries.geojson') });
    map.addLayer({
      id: 'pantries',
      type: 'circle',
      source: 'pantries',
      paint: {
        'circle-color': PANTRY_COLOR,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3, 12, 6, 15, 9],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1,
      },
    });

    const popup = new mapboxgl.Popup({ offset: 8 });
    const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f || f.geometry.type !== 'Point') return;
      const p = f.properties ?? {};
      const el = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = p.name;
      el.append(title);
      // Optional fields are left out when the food bank's list has them blank
      const lines = [p.address, p.phone, p.programs && `Programs: ${p.programs}`, p.website];
      for (const line of lines.filter(Boolean)) {
        el.append(document.createElement('br'), String(line));
      }
      popup.setLngLat(f.geometry.coordinates as [number, number]).setDOMContent(el).addTo(map);
    };
    const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
    const clearPointer = () => (map.getCanvas().style.cursor = '');
    map.on('click', 'pantries', onClick);
    map.on('mouseenter', 'pantries', setPointer);
    map.on('mouseleave', 'pantries', clearPointer);

    return () => {
      map.off('click', 'pantries', onClick);
      map.off('mouseenter', 'pantries', setPointer);
      map.off('mouseleave', 'pantries', clearPointer);
      popup.remove();
      if (map.getStyle()) {
        map.removeLayer('pantries');
        map.removeSource('pantries');
      }
    };
  }, [map]);

  useEffect(() => {
    map.setFilter('pantries', ['==', ['get', area === 'atlanta' ? 'inAtlanta' : 'inGeorgia'], true]);
  }, [map, area]);

  return null;
}
