import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { dataUrl } from '../config';
import type { FocusArea } from './AreaFocus';

export const RETAILER_RING = '#1b1b1b';

interface RetailersLayerProps {
  map: mapboxgl.Map;
  area: FocusArea;
  visible: boolean;
}

// Large grocery retailers (Publix, Walmart, Kroger, ALDI, Piggly Wiggly, Food Lion) as white dots with a dark ring,
// so they read differently from the solid pantry dots. Uses the same precomputed inGeorgia / inAtlanta flags.
export function RetailersLayer({ map, area, visible }: RetailersLayerProps) {
  useEffect(() => {
    map.addSource('retailers', { type: 'geojson', data: dataUrl('large_retailers.geojson') });
    map.addLayer({
      id: 'retailers',
      type: 'circle',
      source: 'retailers',
      paint: {
        'circle-color': '#fff',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3, 12, 5.5, 15, 8],
        'circle-stroke-color': RETAILER_RING,
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 7, 1.5, 12, 2.5],
      },
    });

    const popup = new mapboxgl.Popup({ offset: 8 });
    const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
      // Pantry dots drawn above take the click when they overlap
      if (map.getLayer('pantries') && map.queryRenderedFeatures(e.point, { layers: ['pantries'] }).length) return;
      const f = e.features?.[0];
      if (!f || f.geometry.type !== 'Point') return;
      const p = f.properties ?? {};
      const el = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = p.name;
      el.append(title);
      for (const line of [`Large retailer: ${p.retailer}`, p.address, p.phone].filter(Boolean)) {
        el.append(document.createElement('br'), String(line));
      }
      popup.setLngLat(f.geometry.coordinates as [number, number]).setDOMContent(el).addTo(map);
    };
    const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
    const clearPointer = () => (map.getCanvas().style.cursor = '');
    map.on('click', 'retailers', onClick);
    map.on('mouseenter', 'retailers', setPointer);
    map.on('mouseleave', 'retailers', clearPointer);

    return () => {
      map.off('click', 'retailers', onClick);
      map.off('mouseenter', 'retailers', setPointer);
      map.off('mouseleave', 'retailers', clearPointer);
      popup.remove();
      if (map.getStyle()) {
        map.removeLayer('retailers');
        map.removeSource('retailers');
      }
    };
  }, [map]);

  useEffect(() => {
    map.setFilter('retailers', ['==', ['get', area === 'atlanta' ? 'inAtlanta' : 'inGeorgia'], true]);
    map.setLayoutProperty('retailers', 'visibility', visible ? 'visible' : 'none');
  }, [map, area, visible]);

  return null;
}
