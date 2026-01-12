import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { getMockData } from './mockDataService';
import { baseConfig } from './config';

// Components
import { Header } from './components/Header';
import { WelcomePage } from './components/WelcomePage';
import { StatsTable } from './components/StatsTable';
import { BodyModel } from './components/BodyModel';
import { MeasurementModal } from './components/MeasurementModal';
import { SettingsModal } from './components/SettingsModal';

// Firebase
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
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

  // Темна тема
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

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

    if (isGuest) {
      const mockData = getMockData();
      setHistoryData(mockData);
      if (mockData.length > 0) {
        setIndexB(0);
        setIndexA(mockData.length > 1 ? 1 : 0);
      }
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
  }, [user, isGuest]);

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

  const handleGuestLogin = () => {
    setUser({
      uid: 'guest',
      displayName: 'Тестовий Користувач',
      photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random'
    });
    setIsGuest(true);
  };

  const handleLogout = () => {
    if (isGuest) {
      setIsGuest(false);
      setUser(null);
    } else {
      signOut(auth);
    }
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

    if (isGuest) {
      // Локальне збереження для гостя
      setHistoryData(prev => {
        let newData = [...prev];
        if (editingItem?.id && editingItem.id !== date) {
           newData = newData.filter(item => item.id !== editingItem.id);
        }
        const existingIndex = newData.findIndex(item => item.id === date);
        if (existingIndex >= 0) {
          newData[existingIndex] = { ...newData[existingIndex], ...record, id: date };
        } else {
          newData.push({ ...record, id: date });
        }
        return newData.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      });
      closeModal();
      setIsSaving(false);
      return;
    }

    try {
      // Якщо ми редагуємо і дата змінилася, видаляємо старий запис
      if (editingItem?.id && editingItem.id !== date) {
        await deleteDoc(doc(db, `users/${user.uid}/measurements`, editingItem.id));
      }

      await setDoc(doc(db, `users/${user.uid}/measurements`, date), record, { merge: true });
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Помилка збереження");
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setEditingItem(null);
    if (activeModal === 'update') {
      setActiveModal('edit');
    } else {
      setActiveModal(null);
    }
  };

  const deleteRecord = async (dateId) => {
    if (window.confirm("Видалити цей запис?")) {
      if (isGuest) {
        setHistoryData(prev => prev.filter(item => item.id !== dateId));
        return;
      }
      try {
        await deleteDoc(doc(db, `users/${user.uid}/measurements`, dateId));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const getValue = (data, key) => data ? (data[key] || 0) : 0;

  const fillWithLastData = () => {
    if (historyData.length === 0) return;
    const lastItem = historyData[0];
    
    // Знаходимо форму
    const form = document.querySelector('form');
    if (!form) return;

    // Заповнюємо поля значеннями з останнього запису
    activeFields.forEach(key => {
      const val = getValue(lastItem, key);
      // Перевіряємо, чи існує поле в формі, і встановлюємо значення
      if (form.elements[key]) {
        form.elements[key].value = val || '';
      }
    });
    
    // Окремо заповнюємо примітку, якщо вона є
    if (form.elements['note']) {
      form.elements['note'].value = lastItem.note || '';
    }
  };

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
    return <WelcomePage handleLogin={handleLogin} handleGuestLogin={handleGuestLogin} />;
  }

  const dataA = historyData[indexA];
  const dataB = historyData[indexB];

  return (
    <div className="App">
      <Header 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        handleLogout={handleLogout} 
        setActiveModal={setActiveModal} 
        setEditingItem={setEditingItem} 
      />

      <div className="main-layout">
        {historyData.length > 0 ? (
            <StatsTable 
              historyData={historyData}
              activeFields={activeFields}
              baseConfig={baseConfig}
              getValue={getValue}
              renderDiff={renderDiff}
              indexA={indexA}
              setIndexA={setIndexA}
              indexB={indexB}
              setIndexB={setIndexB}
              setHoveredPart={setHoveredPart}
              hoveredPart={hoveredPart}
              dataA={dataA}
              dataB={dataB}
            />
          ) : (
            <div className="data-container">
              <div className="empty-state">
                <p>У вас ще немає записів.</p>
                <button className="btn btn-primary" onClick={() => setActiveModal('add')}>Додати перший замір</button>
              </div>
            </div>
          )}

          <BodyModel 
            getPartStyle={getPartStyle}
            idMap={idMap}
            setHoveredPart={setHoveredPart}
            setTooltipPos={setTooltipPos}
            hoveredPart={hoveredPart}
            tooltipPos={tooltipPos}
            baseConfig={baseConfig}
            dataA={dataA}
            dataB={dataB}
            getValue={getValue}
            renderDiff={renderDiff}
          />
      </div>

      {(activeModal === 'add' || activeModal === 'edit' || activeModal === 'update') && (
        <MeasurementModal 
          activeModal={activeModal}
          closeModal={closeModal}
          saveRecord={saveRecord}
          editingItem={editingItem}
          activeFields={activeFields}
          baseConfig={baseConfig}
          getValue={getValue}
          fillWithLastData={fillWithLastData}
          historyData={historyData}
          isSaving={isSaving}
          deleteRecord={deleteRecord}
          setEditingItem={setEditingItem}
          setActiveModal={setActiveModal}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal 
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          settings={settings}
          setSettings={setSettings}
          baseConfig={baseConfig}
          toggleVisibility={toggleVisibility}
        />
      )}

    </div>
  );
}

export default App;