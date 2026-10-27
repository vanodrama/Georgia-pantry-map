import { useEffect, useRef, useState, type ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mapConfig } from '../config';

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface BaseMapProps {
  // Layers render once the style has loaded and receive the map instance
  children?: (map: mapboxgl.Map) => ReactNode;
}

export function BaseMap({ children }: BaseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    mapboxgl.accessToken = token;
    const m = new mapboxgl.Map({ container: containerRef.current, ...mapConfig });
    m.addControl(new mapboxgl.NavigationControl(), 'top-right');
    m.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left');
    m.on('load', () => setMap(m));
    return () => {
      setMap(null);
      m.remove();
    };
  }, []);

  if (!token) {
    return (
      <div className="missing-token">
        Add your Mapbox public token to <code>.env.local</code> as <code>VITE_MAPBOX_TOKEN=pk...</code>, then restart the dev server.
      </div>
    );
  }
  return (
    <div ref={containerRef} className="map">
      {map && children?.(map)}
    </div>
  );
}
