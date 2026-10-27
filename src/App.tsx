import { useState } from 'react';
import { BaseMap } from './components/BaseMap';
import { CityOutline, OUTLINE_COLOR } from './components/CityOutline';
import { AreaFocus, focusAreas, type FocusArea } from './components/AreaFocus';
import { StateBoundaries, STATE_LINE_COLOR } from './components/StateBoundaries';
import { PantriesLayer, PANTRY_COLOR, programTypes } from './components/PantriesLayer';
import { StoresLayer, largeRetailers, snapRetailers, snapStoreTypes, SNAP_COLOR } from './components/StoresLayer';
import { TractsLayer, tractRamp, tractMeasures } from './components/TractsLayer';

export default function App() {
  const [measure, setMeasure] = useState(tractMeasures[0]);
  const [area, setArea] = useState<FocusArea>('atlanta');
  const [types, setTypes] = useState<string[]>(programTypes);
  const [showPantries, setShowPantries] = useState(true);
  const [showRetailers, setShowRetailers] = useState(true);
  const [showSnap, setShowSnap] = useState(true);
  const [snapTypes, setSnapTypes] = useState<string[]>(snapStoreTypes);
  const toggleSnapType = (t: string) =>
    setSnapTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : snapStoreTypes.filter((x) => x === t || cur.includes(x))));
  const toggleType = (t: string) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : programTypes.filter((x) => x === t || cur.includes(x))));
  const b = measure.breaks;
  const classLabels = [`< ${b[0]}%`, ...b.slice(1).map((v, i) => `${b[i]} – ${v}%`), `≥ ${b[b.length - 1]}%`];

  return (
    <>
      {/* Order matters: tracts sit under labels, the grey mask covers everything outside the chosen area, outline and pantry dots draw on top */}
      <BaseMap>
        {(map) => (
          <>
            <StateBoundaries map={map} />
            <TractsLayer map={map} measure={measure} area={area} />
            <AreaFocus map={map} area={area} />
            <CityOutline map={map} />
            <StoresLayer map={map} config={snapRetailers} area={area} visible={showSnap} types={snapTypes} />
            <StoresLayer map={map} config={largeRetailers} area={area} visible={showRetailers} />
            <PantriesLayer map={map} area={area} types={types} visible={showPantries} />
          </>
        )}
      </BaseMap>
      <div className="legend">
        <div className="area-switch" role="group" aria-label="Show area">
          {focusAreas.map((a) => (
            <button key={a.key} className={a.key === area ? 'active' : ''} aria-pressed={a.key === area} onClick={() => setArea(a.key)}>
              {a.label}
            </button>
          ))}
        </div>
        <label className="legend-row layer-toggle">
          <input id="show-pantries" type="checkbox" checked={showPantries} onChange={(e) => setShowPantries(e.target.checked)} />
          <span className="dot" style={{ background: PANTRY_COLOR }} /> Food pantries
        </label>
        <details className="program-filter">
          <summary>
            Filter by program{types.length < programTypes.length ? ` (${types.length} of ${programTypes.length})` : ''}
          </summary>
          <div className="filter-actions">
            <button type="button" onClick={() => setTypes(programTypes)}>All</button>
            <button type="button" onClick={() => setTypes([])}>None</button>
          </div>
          {programTypes.map((t) => (
            <label key={t || 'none'} className="filter-option">
              <input id={`program-${t || 'none'}`} type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} />
              {t || 'No type listed'}
            </label>
          ))}
        </details>
        <label className="legend-row layer-toggle">
          <input id="show-retailers" type="checkbox" checked={showRetailers} onChange={(e) => setShowRetailers(e.target.checked)} />
          <span className="dot ring" /> Large retailers
        </label>
        <label className="legend-row layer-toggle">
          <input id="show-snap" type="checkbox" checked={showSnap} onChange={(e) => setShowSnap(e.target.checked)} />
          <span className="dot small" style={{ background: SNAP_COLOR }} /> SNAP-authorized stores
        </label>
        <details className="program-filter">
          <summary>
            Filter by store type{snapTypes.length < snapStoreTypes.length ? ` (${snapTypes.length} of ${snapStoreTypes.length})` : ''}
          </summary>
          <div className="filter-actions">
            <button type="button" onClick={() => setSnapTypes(snapStoreTypes)}>All</button>
            <button type="button" onClick={() => setSnapTypes([])}>None</button>
          </div>
          {snapStoreTypes.map((t) => (
            <label key={t} className="filter-option">
              <input id={`snap-${t}`} type="checkbox" checked={snapTypes.includes(t)} onChange={() => toggleSnapType(t)} />
              {t}
            </label>
          ))}
        </details>
        <div className="legend-row">
          <span className="dash" style={{ borderColor: OUTLINE_COLOR }} /> Atlanta city limits
        </div>
        <div className="legend-row">
          <span className="line" style={{ borderColor: STATE_LINE_COLOR }} /> State boundaries
        </div>
        <div className="legend-section">
          <select value={measure.key} onChange={(e) => setMeasure(tractMeasures.find((m) => m.key === e.target.value) ?? tractMeasures[0])}>
            {tractMeasures.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          {classLabels.map((l, i) => (
            <div key={l} className="legend-row">
              <span className="swatch" style={{ background: tractRamp[i] }} /> {l}
            </div>
          ))}
          <div className="legend-note">{measure.note}</div>
        </div>
      </div>
    </>
  );
}
