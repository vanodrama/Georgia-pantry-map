import { useEffect } from 'react';
import { dataUrl } from '../config';
import mapboxgl from 'mapbox-gl';

// PLACES and SNAP-retailer access use 2020 tracts; the large-retailer Atlas uses 2010 tracts
const datasets = {
  tracts2020: dataUrl('ga_tracts_places.geojson'),
  tracts2010: dataUrl('ga_tracts_2010_food_access.geojson'),
};

type Dataset = keyof typeof datasets;

export type TractMeasure = 'foodInsecurity' | 'foodStamps' | 'lowAccess' | 'snapLowAccess';

export interface MeasureOption {
  key: TractMeasure;
  label: string;
  dataset: Dataset;
  // Upper bounds of each class; values above the last fall in the top class
  breaks: number[];
  note: string;
}

// Access shares: population beyond 1 mile (urban tracts) or 10 miles (rural tracts), straight-line
const accessBreaks = [1, 25, 50, 75];

export const tractMeasures: MeasureOption[] = [
  { key: 'foodInsecurity', label: 'Food insecurity (% of adults)', dataset: 'tracts2020', breaks: [10, 15, 20, 28], note: 'CDC PLACES 2025 (2023 data), 2020 tracts' },
  { key: 'foodStamps', label: 'Received food stamps (% of adults)', dataset: 'tracts2020', breaks: [7, 11, 16, 24], note: 'CDC PLACES 2025 (2023 data), 2020 tracts' },
  { key: 'lowAccess', label: 'Low access to large retailers (% of people)', dataset: 'tracts2010', breaks: accessBreaks, note: 'USDA Food Access Research Atlas, 2010 tracts. Beyond 1 mi (urban) / 10 mi (rural) of a supermarket' },
  { key: 'snapLowAccess', label: 'Low access to SNAP retailers (% of people)', dataset: 'tracts2020', breaks: accessBreaks, note: 'USDA SNAP-authorized Retailer Access Map, 2020 tracts. Beyond 1 mi (urban) / 10 mi (rural), straight-line' },
];

// Low to high: green, light yellow, red
export const tractRamp = ['#1a9850', '#91cf60', '#ffffbf', '#fc8d59', '#d73027'];

interface TractsLayerProps {
  map: mapboxgl.Map;
  measure: MeasureOption;
}

function fillColor({ key, breaks }: MeasureOption): mapboxgl.ExpressionSpecification {
  const steps = breaks.flatMap((b, i) => [b, tractRamp[i + 1]]);
  return ['case', ['==', ['get', key], null], '#cccccc', ['step', ['get', key], tractRamp[0], ...steps]];
}

const pct = (v: unknown) => (v == null ? 'n/a' : `${v}%`);

// Popup lines for each dataset's tract properties
function popupLines(dataset: Dataset, p: Record<string, unknown>): string[] {
  const area = p.urban ? 'Urban' : 'Rural';
  if (dataset === 'tracts2010') {
    return [
      `${area} tract · low access to large retailers: ${pct(p.lowAccess)}`,
      `Low income & low access (food desert): ${p.lila ? 'Yes' : 'No'}`,
      `Poverty rate: ${pct(p.povertyRate)}`,
      `Population (2010): ${Number(p.population).toLocaleString('en-US')}`,
    ];
  }
  return [
    `Food insecurity: ${pct(p.foodInsecurity)}`,
    `Received food stamps: ${pct(p.foodStamps)}`,
    `${area} tract · low access to SNAP retailers: ${pct(p.snapLowAccess)}`,
    `Population: ${Number(p.population).toLocaleString('en-US')}`,
  ];
}

// Census-tract measures shaded green (low) through light yellow to red (high), drawn under the basemap labels.
export function TractsLayer({ map, measure }: TractsLayerProps) {
  useEffect(() => {
    const firstLabel = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
    map.addSource('tracts', { type: 'geojson', data: datasets[measure.dataset] });
    map.addLayer(
      { id: 'tracts-fill', type: 'fill', source: 'tracts', paint: { 'fill-opacity': 0.6 } },
      firstLabel,
    );
    map.addLayer(
      { id: 'tracts-line', type: 'line', source: 'tracts', paint: { 'line-color': '#fff', 'line-width': 0.3, 'line-opacity': 0.6 } },
      firstLabel,
    );
    // Boundary of the clicked tract; the filter is swapped on each click. Added on top (no beforeId)
    // so roads don't cover it; layers added later (city outline, pantries) still draw above it.
    map.addLayer({
      id: 'tracts-selected',
      type: 'line',
      source: 'tracts',
      filter: ['==', ['get', 'geoid'], ''],
      paint: { 'line-color': '#111', 'line-width': 3 },
    });

    return () => {
      if (map.getStyle()) {
        map.removeLayer('tracts-selected');
        map.removeLayer('tracts-line');
        map.removeLayer('tracts-fill');
        map.removeSource('tracts');
      }
    };
    // The source is created once; dataset switches go through setData below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    // The layer may already be gone when the popup closes during teardown
    const select = (geoid: string) =>
      map.getLayer('tracts-selected') && map.setFilter('tracts-selected', ['==', ['get', 'geoid'], geoid]);
    const popup = new mapboxgl.Popup();
    const clearSelection = () => select('');
    popup.on('close', clearSelection);
    const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
      // Pantry and retailer dots have their own popups
      const pointLayers = ['pantries', 'retailers'].filter((id) => map.getLayer(id));
      if (pointLayers.length && map.queryRenderedFeatures(e.point, { layers: pointLayers }).length) return;
      const p = e.features?.[0]?.properties;
      if (!p) return;
      const el = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `Tract ${p.geoid} (${p.county} County)`;
      el.append(title);
      for (const line of popupLines(measure.dataset, p)) {
        el.append(document.createElement('br'), line);
      }
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(map);
      // After addTo, since re-adding an open popup can fire its close event
      select(p.geoid);
    };
    map.on('click', 'tracts-fill', onClick);

    map.setPaintProperty('tracts-fill', 'fill-color', fillColor(measure));

    return () => {
      map.off('click', 'tracts-fill', onClick);
      // Detach first: on teardown the map may already be removed when the popup closes
      popup.off('close', clearSelection);
      popup.remove();
    };
  }, [map, measure]);

  useEffect(() => {
    (map.getSource('tracts') as mapboxgl.GeoJSONSource).setData(datasets[measure.dataset]);
  }, [map, measure.dataset]);

  return null;
}
