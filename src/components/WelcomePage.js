import React from 'react';

export const WelcomePage = ({ handleLogin, handleGuestLogin }) => {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>MyMetricsBody</h1>
        <p>Твій персональний трекер прогресу тіла.</p>
        <p>Візуалізуй зміни, слідкуй за кожним сантиметром, досягай цілей.</p>
        <button className="btn btn-google" onClick={handleLogin}>
          Увійти через Google
        </button>
        <button className="btn btn-secondary" style={{marginTop: '15px', width: '100%'}} onClick={handleGuestLogin}>
          Увійти як Гість (Demo)
        </button>
      </div>
    </div>
  );
};