import React from 'react';

export const StatsTable = ({ 
  historyData, 
  activeFields, 
  baseConfig, 
  getValue, 
  renderDiff, 
  indexA, 
  setIndexA, 
  indexB, 
  setIndexB, 
  setHoveredPart, 
  hoveredPart,
  dataA,
  dataB
}) => {
  return (
    <div className="data-container">
      <div className="controls">
        <label>
          Дата А:
          <select value={indexA} onChange={e => setIndexA(Number(e.target.value))}>
            {historyData.map((d, i) => <option key={d.id} value={i}>{d.Date}</option>)}
          </select>
        </label>
        <span className="vs-label">vs</span>
        <label>
          Дата Б:
          <select value={indexB} onChange={e => setIndexB(Number(e.target.value))}>
            {historyData.map((d, i) => <option key={d.id} value={i}>{d.Date}</option>)}
          </select>
        </label>
      </div>

      <table className="stats-table">
        <thead>
          <tr>
            <th>Частина</th>
            <th>{dataA?.Date}</th>
            <th>{dataB?.Date}</th>
            <th>Різниця</th>
          </tr>
        </thead>
        <tbody>
          {activeFields.map(key => {
            const info = baseConfig[key];
            const valA = getValue(dataA, key);
            const valB = getValue(dataB, key);
            const unit = (key === 'weight' || key === 'height') ? (key === 'weight' ? 'кг' : 'см') : 'см';
            return (
              <tr key={key} 
                  onMouseEnter={() => setHoveredPart(key)} 
                  onMouseLeave={() => setHoveredPart(null)} 
                  className={hoveredPart === key ? 'highlight-row' : ''}>
                <td>{info.label}</td>
                <td>{valA || '-'} {unit}</td>
                <td>{valB || '-'} {unit}</td>
                <td>{renderDiff(valA, valB, info.isFat)} {unit}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};