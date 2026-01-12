import React, { useState, useEffect } from 'react';
import { Icons } from '../assets/Icons';

export const Header = ({ user, isDarkMode, toggleTheme, handleLogout, setActiveModal, setEditingItem }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.user-menu')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="app-header">
        <div className="logo">MyMetricsBody</div>
        <div className="user-menu">
          <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Світла тема" : "Темна тема"}>
            {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
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
  );
};
