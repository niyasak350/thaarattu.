import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/manjari/400.css';
import '@fontsource/manjari/700.css';
import App from './App';
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './SettingsContext';
import { LangProvider } from './i18n';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SettingsProvider>
      <LangProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LangProvider>
    </SettingsProvider>
  </BrowserRouter>
);
