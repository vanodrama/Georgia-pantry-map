import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { dataUrl } from '../config';
import type { FocusArea } from './AreaFocus';

export interface StoreLayerConfig {
  id: string;
  file: string;
  paint: mapboxgl.CirclePaint;
  // Popup lines after the store name, from the feature's properties
  details: (p: Record<string, unknown>) => unknown[];
}

// Large grocery chains: white dots with a dark ring, so they read differently from the solid pantry dots
export const largeRetailers: StoreLayerConfig = {
  id: 'retailers',
  file: 'large_retailers.geojson',
  paint: {
    'circle-color': '#fff',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3, 12, 5.5, 15, 8],
    'circle-stroke-color': '#1b1b1b',
    'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 7, 1.5, 12, 2.5],
  },
  details: (p) => [`Large retailer: ${p.retailer}`, p.address, p.phone],
};

// USDA SNAP-authorized stores: small navy dots, since there are ~9,000 of them
export const SNAP_COLOR = '#1f2f86';
export const snapRetailers: StoreLayerConfig = {
  id: 'snap-retailers',
  file: 'snap_retailers.geojson',
  paint: {
    'circle-color': SNAP_COLOR,
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 1.6, 12, 3.5, 15, 6],
    'circle-stroke-color': '#fff',
    'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 7, 0, 11, 0.8],
  },
  details: (p) => [`SNAP-authorized: ${p.type}`, p.address],
};

// Store types in the USDA SNAP retailer list, most common first
export const snapStoreTypes = [
  'Convenience Store',
  'Other',
  'Supermarket',
  'Super Store',
  'Grocery Store',
  'Farmers and Markets',
  'Specialty Store',
];

// Every point layer with its own popup, in drawing order (bottom to top). The tract popup skips clicks on
// all of them, and each store layer skips clicks on those drawn above it.
export const pointLayerIds = [snapRetailers.id, largeRetailers.id, 'pantries'];

// Point features within a few pixels of a click, so small dots are easy to hit (topmost layer first)
export function featuresNear(map: mapboxgl.Map, point: mapboxgl.Point, layers: string[]) {
  const ids = layers.filter((l) => map.getLayer(l));
  if (!ids.length) return [];
  const r = 5;
  return map.queryRenderedFeatures([[point.x - r, point.y - r], [point.x + r, point.y + r]], { layers: ids });
}

interface StoresLayerProps {
  map: mapboxgl.Map;
  config: StoreLayerConfig;
  area: FocusArea;
  visible: boolean;
  // Optional `type` values to keep (SNAP store types); every store is kept when omitted
  types?: string[];
}

// Store points with a popup, filtered to the chosen area by the precomputed inGeorgia / inAtlanta flags.
export function StoresLayer({ map, config, area, visible, types }: StoresLayerProps) {
  const { id } = config;

  useEffect(() => {
    map.addSource(id, { type: 'geojson', data: dataUrl(config.file) });
    map.addLayer({ id, type: 'circle', source: id, paint: config.paint });

    const popup = new mapboxgl.Popup({ offset: 8 });
    const onClick = (e: mapboxgl.MapMouseEvent) => {
      // A point layer drawn above this one takes the click when they overlap
      if (featuresNear(map, e.point, pointLayerIds.slice(pointLayerIds.indexOf(id) + 1)).length) return;
      const f = featuresNear(map, e.point, [id])[0];
      if (!f || f.geometry.type !== 'Point') return;
      const p = f.properties ?? {};
      const el = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = String(p.name);
      el.append(title);
      for (const line of config.details(p).filter(Boolean)) {
        el.append(document.createElement('br'), String(line));
      }
      popup.setLngLat(f.geometry.coordinates as [number, number]).setDOMContent(el).addTo(map);
    };
    const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
    const clearPointer = () => (map.getCanvas().style.cursor = '');
    map.on('click', onClick);
    map.on('mouseenter', id, setPointer);
    map.on('mouseleave', id, clearPointer);

    return () => {
      map.off('click', onClick);
      map.off('mouseenter', id, setPointer);
      map.off('mouseleave', id, clearPointer);
      popup.remove();
      if (map.getStyle()) {
        map.removeLayer(id);
        map.removeSource(id);
      }
    };
    // The config objects are module constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, id]);

  useEffect(() => {
    const inArea: mapboxgl.ExpressionSpecification = ['==', ['get', area === 'atlanta' ? 'inAtlanta' : 'inGeorgia'], true];
    // ["match", input, [values], true, false] can't be mistaken for Mapbox's legacy filter syntax
    const ofType: mapboxgl.ExpressionSpecification | null = types
      ? types.length
        ? ['match', ['get', 'type'], types, true, false]
        : ['==', ['get', 'type'], '#none#']
      : null;
    map.setFilter(id, ofType ? ['all', inArea, ofType] : inArea);
    map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  }, [map, id, area, visible, types]);

  return null;
}
