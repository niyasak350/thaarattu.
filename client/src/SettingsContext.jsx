import { createContext, useContext, useEffect, useState } from 'react';

const DEFAULTS = {
  app_name: 'Thaaraattu',
  tagline: 'Your companion from pregnancy to parenthood',
  intro_video: '',     // link to a video shown as the opening screen (empty = built-in animation)
  intro_seconds: '6',  // how long a YouTube intro stays on screen
  creators_note: '',   // short text at the top of the Creators page
  hero_image: '',      // photo for the first page (empty = the mother and baby picture)
};
const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

// Loads the settings the admin can change and shares them with every page
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const reload = () => fetch('/api/settings')
    .then((res) => (res.ok ? res.json() : {}))
    .then((data) => setSettings({ ...DEFAULTS, ...data }))
    .catch(() => {})
    .finally(() => setLoaded(true));
  useEffect(() => { reload(); }, []);
  useEffect(() => { document.title = settings.app_name; }, [settings.app_name]);

  return <SettingsContext.Provider value={{ ...settings, loaded, reload }}>{children}</SettingsContext.Provider>;
}
