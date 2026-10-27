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

// Program types in the food bank's list, most common first; '' is pantries with none listed
export const programTypes = [
  'Food Distribution',
  'Pop-Up/Mobile Resource',
  'Hot/Cold Meal Program',
  'Distribution of Non-Food Items',
  'Programs-Oasis',
  'Programs-Public Benefits Assistance',
  'Health and Wellness Services',
  'Case Management Services',
  'Educational Courses/Classes',
  'Tax/Financial Support',
  'Legal Assistance',
  'Healthcare Screenings/Referrals',
  'Mental Health Services',
  'Employment Services/Workforce Development',
  'Shelter',
  'Other',
  '',
];

interface PantriesLayerProps {
  map: mapboxgl.Map;
  // Only pantries inside the chosen area are shown (precomputed `inGeorgia` / `inAtlanta` flags)
  area: FocusArea;
  // Program types to show; a pantry is shown if it offers any of them
  types: string[];
}

// `programTypes` is a pipe-delimited list like "|Food Distribution|Shelter|", so membership is a substring test
function typeFilter(types: string[]): mapboxgl.ExpressionSpecification {
  // Written so Mapbox can't mistake them for its legacy filter syntax (e.g. ["in", key, ...values])
  // Matches nothing: no pantry has this value
  if (types.length === 0) return ['==', ['get', 'programTypes'], '#none#'];
  return [
    'any',
    ...types.map((t): mapboxgl.ExpressionSpecification =>
      t === ''
        ? ['==', ['get', 'programTypes'], '']
        : ['>=', ['index-of', `|${t}|`, ['get', 'programTypes']], 0],
    ),
  ];
}

// Atlanta Community Food Bank partner locations from /food_pantries.geojson, with a popup on click.
export function PantriesLayer({ map, area, types }: PantriesLayerProps) {
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
    map.setFilter('pantries', ['all', ['==', ['get', area === 'atlanta' ? 'inAtlanta' : 'inGeorgia'], true], typeFilter(types)]);
  }, [map, area, types]);

  return null;
}
