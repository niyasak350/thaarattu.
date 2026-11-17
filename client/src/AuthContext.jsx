import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Keeps track of who is logged in and shares it with every page
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, check if the saved token is still valid
  useEffect(() => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  function saveLogin(data) {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, saveLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
