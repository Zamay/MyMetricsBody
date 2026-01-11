import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import front from './assets/images/male-front.png';
import back from './assets/images/male-back.png';

// Firebase
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";

// --- КОНФІГУРАЦІЯ ПОЛІВ ---
const baseConfig = {
  height:     { label: "Зріст", isFat: false, defaultEnabled: true },
  weight:     { label: "Вага", isFat: true, defaultEnabled: true },
  neck:       { label: "Шия", isFat: false, defaultEnabled: false },
  shoulders:  { label: "Плечі", isFat: false, defaultEnabled: false },
  chest:      { label: "Груди", isFat: false, defaultEnabled: true },
  belly:      { label: "Живіт", isFat: true, defaultEnabled: true },
  waist:      { label: "Талія", isFat: true, defaultEnabled: true },
  hips:       { label: "Сідниці", isFat: false, defaultEnabled: true },
  
  // Групи кінцівок
  biceps:     { label: "Біцепс", isFat: false, defaultEnabled: true, group: 'arms' },
  biceps_r:   { label: "Біцепс (П)", isFat: false, group: 'arms', side: 'right' },
  biceps_l:   { label: "Біцепс (Л)", isFat: false, group: 'arms', side: 'left' },

  wrist:      { label: "Кість", isFat: false, defaultEnabled: true, group: 'wrists' },
  wrist_r:    { label: "Кість (П)", isFat: false, group: 'wrists', side: 'right' },
  wrist_l:    { label: "Кість (Л)", isFat: false, group: 'wrists', side: 'left' },

  thigh:      { label: "Стегно", isFat: false, defaultEnabled: true, group: 'thighs' },
  thigh_r:    { label: "Стегно (П)", isFat: false, group: 'thighs', side: 'right' },
  thigh_l:    { label: "Стегно (Л)", isFat: false, group: 'thighs', side: 'left' },

  calf:       { label: "Гомілка", isFat: false, defaultEnabled: true, group: 'calves' },
  calf_r:     { label: "Гомілка (П)", isFat: false, group: 'calves', side: 'right' },
  calf_l:     { label: "Гомілка (Л)", isFat: false, group: 'calves', side: 'left' },
};

// SVG Іконки для меню
const Icons = {
  Add: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Edit: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
};

function App() {
  const [user, setUser] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Налаштування відображення
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('bodyMapSettings');
    let parsedSettings = saved ? JSON.parse(saved) : {};

    // Генеруємо дефолтні налаштування
    const defaults = {
      splitArms: false,
      splitWrists: false,
      splitThighs: false,
      splitCalves: false,
      // Видимість зон
      visible: {}
    };

    Object.keys(baseConfig).forEach(key => {
      if (!baseConfig[key].side) { // Тільки основні зони
        defaults.visible[key] = baseConfig[key].defaultEnabled;
      }
    });

    // Міграція старих налаштувань (якщо є)
    if (!parsedSettings.visible) {
      parsedSettings.visible = { ...defaults.visible };
      // Переносимо старі прапорці, якщо вони були
      if (typeof parsedSettings.showNeck !== 'undefined') parsedSettings.visible.neck = parsedSettings.showNeck;
      if (typeof parsedSettings.showShoulders !== 'undefined') parsedSettings.visible.shoulders = parsedSettings.showShoulders;
    }

    return { ...defaults, ...parsedSettings, visible: { ...defaults.visible, ...parsedSettings.visible } };
  });

  // Стан інтерфейсу
  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(0);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'add', 'edit' (list), 'update' (form), 'settings'
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- ЕФЕКТИ ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setHistoryData([]);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/measurements`), orderBy("Date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoryData(data);
      if (data.length > 0) {
        setIndexB(0);
        setIndexA(data.length > 1 ? 1 : 0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bodyMapSettings', JSON.stringify(settings));
  }, [settings]);


  // --- ЛОГІКА МАППІНГУ ---

  const activeFields = useMemo(() => {
    const fields = [];
    const v = settings.visible || {};

    if (v.height) fields.push('height');
    if (v.weight) fields.push('weight');
    if (v.neck) fields.push('neck');
    if (v.shoulders) fields.push('shoulders');
    if (v.chest) fields.push('chest');
    if (v.belly) fields.push('belly');
    if (v.waist) fields.push('waist');
    if (v.hips) fields.push('hips');

    if (v.biceps) {
      if (settings.splitArms) fields.push('biceps_r', 'biceps_l'); else fields.push('biceps');
    }
    if (v.wrist) {
      if (settings.splitWrists) fields.push('wrist_r', 'wrist_l'); else fields.push('wrist');
    }
    if (v.thigh) {
      if (settings.splitThighs) fields.push('thigh_r', 'thigh_l'); else fields.push('thigh');
    }
    if (v.calf) {
      if (settings.splitCalves) fields.push('calf_r', 'calf_l'); else fields.push('calf');
    }

    return fields;
  }, [settings]);

  const idMap = useMemo(() => {
    const map = {};
    const v = settings.visible || {};

    if (v.chest) { map["frt_9"] = "chest"; map["bck_3"] = "chest"; }
    if (v.belly) { map["frt_10"] = "belly"; map["bck_4"] = "belly"; }
    if (v.waist) { map["frt_11"] = "waist"; }
    if (v.hips) { map["bck_5"] = "hips"; }
    if (v.neck) { map["frt_8"] = "neck"; map["bck_2"] = "neck"; }
    if (v.shoulders) { 
      map["frt_13"] = "shoulders"; map["frt_14"] = "shoulders"; 
      map["bck_6"] = "shoulders"; map["bck_7"] = "shoulders"; 
    }

    // Руки
    if (v.biceps) {
      if (settings.splitArms) {
        map["frt_15"] = "biceps_r"; map["bck_9"] = "biceps_r";
        map["frt_16"] = "biceps_l"; map["bck_8"] = "biceps_l";
      } else {
        map["frt_15"] = "biceps"; map["bck_9"] = "biceps";
        map["frt_16"] = "biceps"; map["bck_8"] = "biceps";
      }
    }

    // Кісті
    if (v.wrist) {
      if (settings.splitWrists) {
        map["frt_21"] = "wrist_r"; map["bck_15"] = "wrist_r";
        map["frt_22"] = "wrist_l"; map["bck_14"] = "wrist_l";
      } else {
        map["frt_21"] = "wrist"; map["bck_15"] = "wrist";
        map["frt_22"] = "wrist"; map["bck_14"] = "wrist";
      }
    }

    // Стегна
    if (v.thigh) {
      if (settings.splitThighs) {
        map["frt_25"] = "thigh_r"; map["bck_19"] = "thigh_r";
        map["frt_26"] = "thigh_l"; map["bck_18"] = "thigh_l";
      } else {
        map["frt_25"] = "thigh"; map["bck_19"] = "thigh";
        map["frt_26"] = "thigh"; map["bck_18"] = "thigh";
      }
    }

    // Гомілки
    if (v.calf) {
      if (settings.splitCalves) {
        map["frt_29"] = "calf_r"; map["bck_23"] = "calf_r";
        map["frt_30"] = "calf_l"; map["bck_22"] = "calf_l";
      } else {
        map["frt_29"] = "calf"; map["bck_23"] = "calf";
        map["frt_30"] = "calf"; map["bck_22"] = "calf";
      }
    }

    return map;
  }, [settings]);


  // --- ФУНКЦІЇ ---

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  const saveRecord = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.target);
    const date = formData.get('Date');
    
    const record = { Date: date };
    activeFields.forEach(key => {
      const val = formData.get(key);
      if (val) record[key] = parseFloat(val);
    });
    const note = formData.get('note');
    if (note) record.note = note;

    try {
      // Якщо ми редагуємо і дата змінилася, видаляємо старий запис
      if (editingItem?.id && editingItem.id !== date) {
        await deleteDoc(doc(db, `users/${user.uid}/measurements`, editingItem.id));
      }

      await setDoc(doc(db, `users/${user.uid}/measurements`, date), record, { merge: true });
      setEditingItem(null);
      
      // Якщо ми були в режимі редагування (update), повертаємось до списку (edit)
      if (activeModal === 'update') {
        setActiveModal('edit');
      } else {
        setActiveModal(null);
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Помилка збереження");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (dateId) => {
    if (window.confirm("Видалити цей запис?")) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/measurements`, dateId));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const getValue = (data, key) => data ? (data[key] || 0) : 0;

  const getPartStyle = (id) => {
    const key = idMap[id];
    if (!key || !baseConfig[key]) return {};

    const dataA = historyData[indexA];
    const dataB = historyData[indexB];
    
    const valA = getValue(dataA, key);
    const valB = getValue(dataB, key);
    const diff = valB - valA;
    const { isFat } = baseConfig[key];

    let color = '#f4f4f4'; // Default
    if (diff !== 0 && valA !== 0 && valB !== 0) {
      const isGood = isFat ? diff < 0 : diff > 0;
      color = isGood ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)';
    } else if (valB > 0) {
        color = 'rgba(33, 150, 243, 0.3)'; // Просто є дані
    }

    return {
      fill: color,
      fillOpacity: 1,
      stroke: isFat ? '#ff9800' : '#2196f3',
      strokeWidth: 1
    };
  };

  const renderDiff = (valA, valB, isFat) => {
    if (!valA || !valB) return <span style={{color: '#ccc'}}>-</span>;
    const diff = valB - valA;
    if (diff === 0) return <span style={{color: '#2196f3'}}>0</span>;
    const isGood = isFat ? diff < 0 : diff > 0;
    const color = isGood ? '#4caf50' : '#f44336';
    const sign = diff > 0 ? '+' : '';
    return <span style={{ color, fontWeight: 'bold' }}>{sign}{diff.toFixed(1)}</span>;
  };

  const toggleVisibility = (key) => {
    setSettings(prev => ({
      ...prev,
      visible: {
        ...prev.visible,
        [key]: !prev.visible[key]
      }
    }));
  };

  // --- RENDER ---

  if (loading) return <div className="loading-screen">Завантаження...</div>;

  if (!user) {
    return (
      <div className="welcome-page">
        <div className="welcome-content">
          <h1>MyMetricsBody</h1>
          <p>Твій персональний трекер прогресу тіла.</p>
          <p>Візуалізуй зміни, слідкуй за кожним сантиметром, досягай цілей.</p>
          <button className="btn btn-google" onClick={handleLogin}>
            Увійти через Google
          </button>
        </div>
      </div>
    );
  }

  const dataA = historyData[indexA];
  const dataB = historyData[indexB];

  return (
    <div className="App">
      {/* HEADER */}
      <header className="app-header">
        <div className="logo">MyMetricsBody</div>
        <div className="user-menu">
          <div className="avatar" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <img src={user.photoURL} alt={user.displayName} />
          </div>
          {isMenuOpen && (
            <div className="dropdown-menu">
              <div className="menu-item" onClick={() => { setActiveModal('add'); setEditingItem({}); setIsMenuOpen(false); }}>
                <span className="menu-icon"><Icons.Add /></span>
                <span>Додати запис</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveModal('edit'); setIsMenuOpen(false); }}>
                <span className="menu-icon"><Icons.Edit /></span>
                <span>Редагувати дані</span>
              </div>
              <div className="menu-item" onClick={() => { setActiveModal('settings'); setIsMenuOpen(false); }}>
                <span className="menu-icon"><Icons.Settings /></span>
                <span>Налаштування</span>
              </div>
              <div className="menu-item danger" onClick={handleLogout}>
                <span className="menu-icon"><Icons.Logout /></span>
                <span>Вийти</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="main-layout">
        
        {/* DATA CONTAINER */}
        <div className="data-container">
          {historyData.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="empty-state">
              <p>У вас ще немає записів.</p>
              <button className="btn btn-primary" onClick={() => setActiveModal('add')}>Додати перший замір</button>
            </div>
          )}
        </div>

        {/* BODY MODELS */}
        <div className="body-wrapper">
          {/* TOOLTIP */}
          {hoveredPart && (
            <div className="tooltip" style={{ left: tooltipPos.x + 20, top: tooltipPos.y + 20 }}>
              <div className="tooltip-title">{baseConfig[hoveredPart]?.label}</div>
              <div>{dataB?.Date}: <strong>{getValue(dataB, hoveredPart)}</strong></div>
              <div>{dataA?.Date}: {getValue(dataA, hoveredPart)}</div>
            </div>
          )}

          <div className="body-view">
            <svg viewBox="0 0 800 1360" onMouseMove={e => setTooltipPos({x: e.clientX, y: e.clientY})}>
              <image href={front} width="800" height="1360" />
              <path id="frt_8" style={getPartStyle("frt_8")} d="M345.667,243.167c15.667-0.833,41.167-2.166,45.333,3.667s15.834,6,19.667,0s38.028-6.245,50.833-4.333c4.95,0.739,9.833,0.81,14.438,0.363c10.976-1.066,20.373-5.078,25.342-10.017c-8.889,0.081-18.524-5.195-31.03-10.721C454.125,215,445.625,206.25,445,203.5s0.125-34.5,0.875-44.5c-9.208,14.333-24.041,23-45.708,23S359,162.667,356,158.667c2.167,6.333,1.5,29.833,0.75,45.333c-8.5,15.25-40,24-48,27.5c2.042,1.655,10.695,6.598,20.857,9.508C334.793,242.493,340.373,243.448,345.667,243.167z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_13" style={getPartStyle("frt_13")} d="M277.48,299.316c6.094-31.882,44.123-54.828,52.127-58.308c-10.162-2.91-18.816-7.853-20.857-9.508c-8,3.5-15.5,2-26.75,4.25S240.5,249,228.5,273.5s-9.5,57-9.25,65.75c0.034,1.202,0.012,2.258-0.058,3.222C232.058,327.083,262.9,323.345,277.48,299.316z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_14" style={getPartStyle("frt_14")} d="M524.5,294c13.5,30.001,46.022,30.211,58.595,48.439c-0.768-3.438-1.004-7.947-0.345-14.439c1.931-19.007-4.875-52.125-17.875-68.5s-53.125-26.75-63.595-26.654c-4.969,4.939-14.366,8.951-25.342,10.017C486.75,245.75,522.482,273.251,524.5,294z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_9" style={getPartStyle("frt_9")} d="M524.5,294c-2.018-20.749-37.75-48.25-48.562-51.137c-4.605,0.447-9.488,0.376-14.438-0.363c-12.805-1.911-47-1.667-50.833,4.333s-15.5,5.833-19.667,0s-29.667-4.5-45.333-3.667c-5.294,0.281-10.873-0.674-16.059-2.159c-8.004,3.48-46.033,26.426-52.127,58.308c-0.459,2.402-0.744,4.852-0.814,7.351c-1,35.667,0.003,72.11-0.165,85.722c0.383-0.096,9.666,25.111,12.166,30.778S293.75,441,297.25,447.75C305.5,455.5,344,473,370.5,466s36.5-6.244,65,0.128s52.668-2.794,73.084-27.211c1.25-3.25,4.75-11.75,5.333-15s2.667-6.999,4.084-9.749s7.455-21.675,8.005-21.176C526.678,379.65,525.667,306.001,524.5,294z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_10" style={getPartStyle("frt_10")} d="M435.5,466.128C407,459.756,397,459,370.5,466s-65-10.5-73.25-18.25c3.5,6.75,2,12,3.75,17.75s5,21.334,0.5,41.501s-1.667,35.666-0.5,40.166c0.785,3.029,2.326,5.001,1.419,8.813C314,567.5,332.834,590.5,402.917,590.5s86.417-20.498,98.75-33.499c-1.666-4.5-0.501-12,2.499-21.167s-3.499-44.667-3.833-52.833s2.501-21.5,2.751-27.584s4.25-13.25,5.5-16.5C488.168,463.334,464,472.5,435.5,466.128z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_11" style={getPartStyle("frt_11")} d="M402.917,590.5c-70.083,0-88.917-23-100.498-34.52c-0.44,1.852-1.458,4.137-3.419,7.188c-2.708,4.214-5.009,15.491-6.673,27.332c10.34,9.027,56.21,47.939,84.084,82.636c8.255-3.802,35.957-5.104,49.606-0.453c28.214-33.03,74.964-71.046,85.649-79.515c-1-13.666-8.334-31.667-10-36.167C489.334,570.002,473,590.5,402.917,590.5z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_15" style={getPartStyle("frt_15")} d="M276.667,306.667c0.07-2.499,0.354-4.949,0.814-7.351c-14.58,24.029-45.423,27.768-58.288,43.156c-0.437,6.049-2.914,8.093-7.442,14.778C206.5,365,196.5,396.5,193,408.5c-0.507,1.738-0.896,3.229-1.221,4.551c-1.413,17.735,10.718,25.876,24.421,31.618c11.394,4.774,24.501,8.306,33.45,1.543c0.711-1.544,1.634-3.368,2.85-5.712c3.5-6.75,23.363-47.953,24.001-48.111C276.669,378.777,275.667,342.334,276.667,306.667z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_16" style={getPartStyle("frt_16")} d="M587.573,444.669c14.284-5.985,25.869-14.57,23.177-33.919c-1.625-11.25-17.875-51.25-22-57.25c-2.265-3.294-4.53-6.027-5.655-11.061C570.522,324.211,538,324.001,524.5,294c1.167,12.001,2.178,85.65,1.506,98.992c0.108,0.098,20.827,42.675,23.494,48.175C558.012,454.281,574.009,450.353,587.573,444.669z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_21" style={getPartStyle("frt_21")} d="M131.956,581.482c-5.112,12.975-9.774,22.651-10.456,24.143c-0.886,1.939-1.456,3.337-2.977,4.62c9.057,0.416,28.988,8.686,43.015,19.44c2.127-7.809,8.37-20.857,13.05-29.598C164.464,604.958,133.678,590.497,131.956,581.482z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_22" style={getPartStyle("frt_22")} d="M686.75,610.25c-8.5-4-5.75-8.25-9.5-15c-1.7-3.061-4.019-8.847-6.417-15.189c1.834,9.606-37.419,28.219-43.958,18.064c1.544,2.689,5.188,10.48,8.506,17.668c3.15,6.824,6.007,13.104,6.494,13.957C656.75,617.834,678.333,609.666,686.75,610.25z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_25" style={getPartStyle("frt_25")} d="M292.327,590.5c-2.021,14.389-3.102,29.611-2.827,34c0.5,8-6.5,46-11.5,70c-3.981,19.107-12.131,56.915-14.375,92.478c-0.575,9.105,0.172,18.063,0.375,26.522c0.845,35.062,9.541,55.489,16.139,69.427c35.654,13.2,53.799,56.767,88.484,34.358c2.478-11.204,8.03-39.965,9.627-52.285c1.75-13.5,10.083-66.333,11.815-88.167s1.269-38.833,0.435-43.166s-0.167-12.667-0.417-21.334s3.083-10.166,4.083-12.333c-3.834-8.171-10.12-17.359-17.755-26.864C348.538,638.439,302.667,599.527,292.327,590.5z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_26" style={getPartStyle("frt_26")} d="M426.018,672.683c-7.872,9.216-14.301,18.044-18.101,25.734c1.167,0.75,3.083,5.083,4.333,8.083s1,20.75-0.25,31.5s1.5,59.75,3.75,71s8.417,55.334,10.084,67.001s5.166,31.5,7.166,39.833c36.334,25.833,52.479-20.023,89.334-33.168c5.667-10,13.999-27.333,15.999-52.333c0.874-10.926,1.603-27.168,0.824-43.078c-1.002-20.493-3.844-40.436-5.157-47.754c-2.333-13-14.834-82.834-17-92.667s-4.333-40-5.333-53.666C500.981,601.637,454.231,639.652,426.018,672.683z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_29" style={getPartStyle("frt_29")} d="M290.348,962.921c0.085,4.202,0.072,8.622-0.239,13.122c-1.393,20.15-4.799,41.913-4.109,52.957c1,16,4.5,62,7.5,83s6.875,83,7.125,87.5c0.06,1.082,0.008,2.26-0.107,3.478c6.992-11.484,36.463-9.869,44.754-6.101c-1.079-3.858-2.297-10.522-2.438-15.043c-0.167-5.333,7.5-47.167,8.333-58.333s3.667-29.5,4.333-33.333s5.75-17.168,9.5-25.918s3.5-20,2.5-27.25s-3.75-45.75-4.5-51.375s-2.25-13.125-3.5-15.125c-0.615-0.984-0.563-2.333-0.248-3.642C341.372,984.144,300.939,1007.37,290.348,962.921z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="frt_30" style={getPartStyle("frt_30")} d="M442.5,964.834c1.167,2.833-1.25,16.416-4.25,33.916s-4.083,48.751-3.083,56.751s9.667,28.833,11.833,35s0.667,8.833,2,20.833s7.167,47.334,9,59s1.5,21-0.667,27.167C464,1193,500,1190.5,503.5,1206c-0.75-4.25-1.75-10-1-22.25s5-60.25,8.25-87.75s6.75-82,4.5-96.5s-3.5-32-3.5-43.5C503.5,1011.667,459.917,983.001,442.5,964.834z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
            </svg>
          </div>

          <div className="body-view">
            <svg viewBox="0 0 800 1360" onMouseMove={e => setTooltipPos({x: e.clientX, y: e.clientY})}>
              <image href={back} width="800" height="1360" />
              <path id="bck_2" style={getPartStyle("bck_2")} d="M497.833,226c-28-9.5-48.999-27.333-49.999-29.5s0.166-30.667,1.5-34.5c0.248-0.713,0.773-3.584,1.472-7.924c-10.194,20.41-88.806,20.59-99.013-0.432c1.235,6.962,2.32,12.053,2.957,12.855c1.555,1.958,2.93,28.364,0.5,31.5c-7.805,10.073-31.475,20.792-49.208,27.5C327.75,219.5,479.908,222.22,497.833,226z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_6" style={getPartStyle("bck_6")} d="M260.5,300c1-5.75,6.083-52.999,45.542-74.5c-8.126,3.074-15.006,5.307-18.542,6.25c-8.263,2.203-41.894,9.408-53.5,19.5c-17.25,15-26,35-27.5,62.75c-0.721,13.331,0,25.833,0,34.5C216.333,324.25,240.667,322.333,260.5,300z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_7" style={getPartStyle("bck_7")} d="M542.667,300.333c0.164,0.62,0.305,1.276,0.431,1.956c16.05,17.076,38.94,31.042,53.412,43.878c-0.086-0.138-0.175-0.282-0.26-0.417C596.5,325.5,601,295,584,267.25S525.833,235.5,497.833,226C535,248.333,539.667,289,542.667,300.333z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_3" style={getPartStyle("bck_3")} d="M539,351c2.836-16.7,6.265-36.969,4.098-48.71c-0.126-0.68-0.267-1.336-0.431-1.956c-3-11.333-7.667-52-44.834-74.333c-17.925-3.78-170.083-6.5-191.792-0.5c-39.458,21.5-44.542,68.75-45.542,74.5s0.5,26.25,2.25,36.75s8.25,29.583,4.625,66.375c1.125,0,1.5,3.5,1.875,6.125s4.25,16.75,9.25,23s9.25,25,13.25,32.5c4.468,5.507,41.373,10.639,83.746,11.485c9.657,0.193,19.599-1.733,29.504-1.776c9.978-0.044,19.919,1.793,29.499,1.512c39.579-1.163,72.98-6.345,77.196-11.47c2.613-5.708,6.414-14.637,7.473-18.167c1.5-5,2.666-9.167,4.833-12.667s7.833-18.083,8.666-21.083s2.167-9.417,3.334-9.5C535,387.667,536,368.667,539,351z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_4" style={getPartStyle("bck_4")} d="M434.499,475.97c-9.58,0.281-19.521-1.556-29.499-1.512c-9.906,0.043-19.847,1.969-29.504,1.776c-42.373-0.846-79.277-5.978-83.746-11.485c4,7.5,6.5,19,8.5,37.75s-2.25,32-3.25,37.75s-0.227,23.88,1.25,28c1.412,3.939,3.607,9.041-0.422,15.812c6.278-9.18,30.556-16.657,56.643-16.657c29.53,0,31.03,10.279,51.53,10.279c19,0,26-10.042,51.526-10.166c25.239-0.123,43.853,7.19,48.38,16.593c-0.532-1.279-0.915-2.17-1.072-2.61c-0.834-2.333-1.166-6.167-0.333-8.167s2.667-12.833,2.833-19s-3.667-30-4.667-34.833s1.667-28.5,2.334-33.333s3-14.667,4.333-16.833c0.392-0.637,1.273-2.456,2.361-4.833C507.479,469.625,474.078,474.807,434.499,475.97z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_5" style={getPartStyle("bck_5")} d="M457.526,567.518C432,567.642,425,577.684,406,577.684c-20.5,0-22-10.279-51.53-10.279c-26.087,0-50.365,7.477-56.643,16.657c-0.185,0.311-0.366,0.62-0.578,0.938c-6,9-12,51.75-11.5,64s-2.5,24-4,32.5c0,19,7.324,25.063,15.316,37.142C317.76,749.914,355.235,772.904,389.5,739c2.75-2.875,6.75-8.875,7.75-11.625s2-3.25,4.375-3.25s3.75,1.125,4.25,2.875s3.792,8.5,7.292,11.334c37.774,39.903,74.878,12.96,94.414-18.404c8.533-13.701,14.134-14.93,14.134-38.43c-1.558-8.437-3.389-18.087-4.048-21.667c-1.167-6.333-0.5-24.333-2.666-42.667c-1.622-13.732-6.051-25.594-8.521-31.664c-0.206-0.505-0.397-0.97-0.573-1.393C501.379,574.708,482.766,567.395,457.526,567.518z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_8" style={getPartStyle("bck_8")} d="M262.75,336.75c-1.75-10.5-3.25-31-2.25-36.75c-19.833,22.333-44.167,24.25-54,48.5c-6.833,10.667-18.25,33.75-20,44s-4.5,20-7.25,27.75c-3.98,34.526,10.693,40.75,26.143,46.43c16.538,6.08,29.232,0.639,38.288-15.131c1.1-2.171,2.2-4.311,3.152-6.215c3.5-7,16.417-34.458,17.292-37.333s2.125-4.875,3.25-4.875C271,366.333,264.5,347.25,262.75,336.75z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_9" style={getPartStyle("bck_9")} d="M598.107,466.68c14.466-5.319,29.127-11.117,27.667-40.179c-2.005-7.583-4.833-13.009-8.024-28.751c-3.706-18.282-14.002-39.975-21.24-51.583c-14.472-12.836-37.362-26.802-53.412-43.878c2.167,11.742-1.262,32.011-4.098,48.71c-3,17.667-4,36.667-2.999,52.083C537.168,403,538.75,406,540,408.75c1.086,2.39,15.768,34.99,21.069,46.274C570.186,468.092,582.849,472.29,598.107,466.68z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_14" style={getPartStyle("bck_14")} d="M145.309,619.035c-11.382-4.813-18.439-8.452-17.564-14.473c-1.215,4.844-2.068,8.179-2.244,9.105c-0.667,3.5-4.164,10.214-6.167,18.333c-0.375,1.692-2.811,3.547-5.5,4.5c3.667-0.75,44.577,18.365,45.167,20.5c-1-4-1.25-8,7-27c1.483-3.416,3.387-6.993,5.604-10.733C168.979,623.079,156.313,623.688,145.309,619.035z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_15" style={getPartStyle("bck_15")} d="M686,635.75c-3.5-0.5-4-8.25-5.25-12.25c-0.701-2.246-3.058-7.8-5.564-15.248c-1.92,3.999-8.137,7.038-16.994,10.783c-8.745,3.698-21.058,4.07-27.065,2.155c9.067,16.197,11.432,25.37,12.375,29.144c0.527,2.109,0.644,3.571,0.461,4.91c8.146-4.652,34.231-16.276,43.573-19.125C686.977,635.944,686.459,635.815,686,635.75z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_18" style={getPartStyle("bck_18")} d="M297.066,718.642c-7.993-12.078-15.316-18.142-15.316-37.142c-1.5,8.5-8.25,43-9.75,54s-3,14.5-7.25,46.75s-1.25,76,2.75,93.5S280.25,912,282.75,925c14.239,23.213,32.047,27.719,48.263,28.709c17.666,1.079,33.441-2.949,40.654-15.376c1.667-5.833,6-44.5,8.167-58s9.5-61.333,10.5-78.667s1-34.999,0.167-40.999s-1.625-16.292-1-21.667C355.235,772.904,317.76,749.914,297.066,718.642z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_19" style={getPartStyle("bck_19")} d="M413.167,738.334C414,744.168,413.25,748.5,412,767s3.25,73.25,6.5,86.75s7,38,8.75,56.25c1.093,11.397,3.355,23.087,5.571,32.39c8.43,9.247,24.089,12.271,39.665,11.319c15.283-0.934,32.867-4.996,46.76-24.891c0.889-5.953,1.705-9.622,2.004-10.818c0.75-3,10.75-28,13.5-41.25s4.25-43.083,5.25-58.083s-4.499-54.001-5.833-61.667s-3.833-29.666-5.166-35.833s-4.334-21.667-4.834-25.667c-0.218-1.739-1.254-7.511-2.452-14c0,23.5-5.601,24.729-14.134,38.43C488.045,751.294,450.941,778.237,413.167,738.334z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_22" style={getPartStyle("bck_22")} d="M321.476,1003.457c-16.533-1.647-33.065-3.422-35.64,17.488c-0.569,6.737-1.232,12.655-1.836,17.055c-1.75,12.75-5,46-2.5,60s8.75,70.5,9,91.75c2.411,11.598,18.52,15.432,31.624,15.948c13.165,0.52,23.325-2.338,25.624-16.146c1.52-12.183,2.896-25.104,3.086-31.552c0.333-11.333,8.333-24,12.833-37.334s0.5-46.666-1.167-65.5s-4.167-36.333-5.333-41.833C354.743,1006.729,338.109,1005.115,321.476,1003.457z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
              <path id="bck_23" style={getPartStyle("bck_23")} d="M482.023,1003.457c-14.171,1.413-30.511,3.521-36.539,8.198c-0.064,1.573-0.222,3.253-0.484,5.095c-1.25,8.75-7,65.25-7.5,84.75s7.5,36,10.5,40s3.75,15.5,4,21.75c0.127,3.173,1.801,16.722,3.811,30.928c5.639,7.736,15.869,11.903,25.566,11.521c11.76-0.464,25.933-3.604,30.46-12.624c0.124-3.28,0.258-6.378,0.413-9.074c0.75-13,4.75-46.75,7.5-74s3-44.75,1-62.25c-0.921-8.055-1.999-18.392-2.872-30.246C511.377,1004.754,495.682,1002.096,482.023,1003.457z" onMouseEnter={e => setHoveredPart(idMap[e.target.id])} onMouseLeave={() => setHoveredPart(null)}/>
            </svg>
          </div>
        </div>
      </div>

      {/* MODALS */}
      
      {/* ADD / EDIT MODAL */}
      {(activeModal === 'add' || activeModal === 'edit' || activeModal === 'update') && (
        <div className="modal-overlay">
          <div className="modal-content">
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
                  <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Закрити</button>
                </div>
              </div>
            ) : (
              <form onSubmit={saveRecord}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Дата</label>
                    <input 
                      name="Date" 
                      type="date" 
                      required 
                      defaultValue={editingItem?.Date || new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                  {activeFields.map(key => (
                    <div className="form-group" key={key}>
                      <label>{baseConfig[key].label}</label>
                      <input 
                        name={key} 
                        type="number" 
                        step="0.01" 
                        placeholder={key === 'weight' ? 'кг' : 'см'} 
                        defaultValue={editingItem ? editingItem[key] : ''}
                      />
                    </div>
                  ))}
                  <div className="form-group full-width">
                    <label>Примітка</label>
                    <input 
                      name="note" 
                      type="text" 
                      defaultValue={editingItem?.note || ''}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    if (activeModal === 'update') setActiveModal('edit');
                    else setActiveModal(null);
                  }}>Скасувати</button>
                  <button type="submit" className="btn btn-success" disabled={isSaving}>
                    {isSaving ? 'Збереження...' : 'Зберегти'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {activeModal === 'settings' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Налаштування відображення</h3>
            
            <div className="settings-group">
              <h4>Видимість зон</h4>
              {Object.keys(baseConfig).filter(key => !baseConfig[key].side).map(key => (
                <label key={key} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={!!(settings.visible && settings.visible[key])} 
                    onChange={() => toggleVisibility(key)} 
                  />
                  {baseConfig[key].label}
                </label>
              ))}
            </div>

            <div className="settings-group">
              <h4>Деталізація (Ліва/Права)</h4>
              <label className="checkbox-label">
                <input type="checkbox" checked={settings.splitArms} onChange={e => setSettings({...settings, splitArms: e.target.checked})} />
                Руки (Біцепс)
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={settings.splitWrists} onChange={e => setSettings({...settings, splitWrists: e.target.checked})} />
                Кісті
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={settings.splitThighs} onChange={e => setSettings({...settings, splitThighs: e.target.checked})} />
                Стегна
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={settings.splitCalves} onChange={e => setSettings({...settings, splitCalves: e.target.checked})} />
                Гомілки
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Зберегти</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;