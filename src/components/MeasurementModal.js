import React from 'react';

export const MeasurementModal = ({ 
  activeModal, 
  closeModal, 
  saveRecord, 
  editingItem, 
  activeFields, 
  baseConfig, 
  getValue, 
  fillWithLastData, 
  historyData, 
  isSaving, 
  deleteRecord,
  setEditingItem,
  setActiveModal
}) => {
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{activeModal === 'edit' ? 'Редагування записів' : (activeModal === 'update' ? 'Редагування запису' : 'Новий запис')}</h3>
        
        {activeModal === 'edit' ? (
          <div className="edit-list">
            <table className="stats-table">
              <thead><tr><th>Дата</th><th>Вага</th><th>Дії</th></tr></thead>
              <tbody>
                {historyData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.Date}</td>
                    <td>{item.weight} кг</td>
                    <td>
                      <button className="btn btn-warning btn-sm" style={{marginRight: '5px'}} onClick={() => {
                          setEditingItem(item);
                          setActiveModal('update');
                      }}>✎</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(item.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModal}>Закрити</button>
            </div>
          </div>
        ) : (
          <form onSubmit={saveRecord}>
            <div className="form-grid">
              <div className="form-group">
                <label>Дата</label>
                <input name="Date" type="date" required defaultValue={editingItem?.Date || new Date().toISOString().split('T')[0]} />
              </div>
              {activeFields.map(key => (
                <div className="form-group" key={key}>
                  <label>{baseConfig[key].label}</label>
                  <input name={key} type="number" step="0.01" placeholder={key === 'weight' ? 'кг' : 'см'} defaultValue={editingItem ? editingItem[key] : ''} />
                </div>
              ))}
              <div className="form-group full-width">
                <label>Примітка</label>
                <input name="note" type="text" defaultValue={editingItem?.note || ''} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-info" onClick={fillWithLastData} disabled={historyData.length === 0} style={{ marginRight: 'auto' }}>
                Заповнити даними
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Скасувати</button>
              <button type="submit" className="btn btn-success" disabled={isSaving}>{isSaving ? 'Збереження...' : 'Зберегти'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};