import React from 'react';

export const SettingsModal = ({ 
  activeModal, 
  setActiveModal, 
  settings, 
  setSettings, 
  baseConfig, 
  toggleVisibility 
}) => {
  return (
    <div className="modal-overlay" onClick={() => setActiveModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Налаштування відображення</h3>
        
        <div className="settings-group">
          <h4>Видимість зон</h4>
          {Object.keys(baseConfig).filter(key => !baseConfig[key].side).map(key => (
            <label key={key} className="checkbox-label">
              <input type="checkbox" checked={!!(settings.visible && settings.visible[key])} onChange={() => toggleVisibility(key)} />
              {baseConfig[key].label}
            </label>
          ))}
        </div>

        <div className="settings-group">
          <h4>Деталізація (Ліва/Права)</h4>
          <label className="checkbox-label"><input type="checkbox" checked={settings.splitArms} onChange={e => setSettings({...settings, splitArms: e.target.checked})} /> Руки (Біцепс)</label>
          <label className="checkbox-label"><input type="checkbox" checked={settings.splitWrists} onChange={e => setSettings({...settings, splitWrists: e.target.checked})} /> Кісті</label>
          <label className="checkbox-label"><input type="checkbox" checked={settings.splitThighs} onChange={e => setSettings({...settings, splitThighs: e.target.checked})} /> Стегна</label>
          <label className="checkbox-label"><input type="checkbox" checked={settings.splitCalves} onChange={e => setSettings({...settings, splitCalves: e.target.checked})} /> Гомілки</label>
        </div>

        <div className="modal-actions"><button className="btn btn-primary" onClick={() => setActiveModal(null)}>Зберегти</button></div>
      </div>
    </div>
  );
};