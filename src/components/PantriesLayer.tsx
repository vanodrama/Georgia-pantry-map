import { useEffect } from 'react';
import { dataUrl } from '../config';
import mapboxgl from 'mapbox-gl';
import type { FocusArea } from './AreaFocus';

export const PANTRY_COLOR = '#6a1b9a';

interface Program {
  name: string;
  type: string;
  contact: string;
  phone: string;
}

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
      const contact = [p.contact, p.phone].filter(Boolean).join(' · ');
      const lines = [p.address, contact && `Contact: ${contact}`, p.website];
      // Each program: "Name (type)", plus its own contact when it differs from the location's
      const programs: Program[] = JSON.parse(p.programs || '[]');
      for (const prog of programs) {
        const label = [prog.name, prog.type && `(${prog.type})`].filter(Boolean).join(' ');
        const own = [prog.contact !== p.contact && prog.contact, prog.phone !== p.phone && prog.phone].filter(Boolean).join(' · ');
        lines.push(`Program: ${label}${own ? ` · ${own}` : ''}`);
      }
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
