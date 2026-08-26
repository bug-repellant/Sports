import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const ALLOWED_DOMAIN = 'gameopedia.com';

const DEFAULT_USER = {
  id: 'usr_1',
  name: 'Aravind Swaminathan',
  email: 'aravind@gameopedia.com',
  role: 'admin',
  department: 'Engineering',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  favoriteSports: ['badminton', 'football', 'pickleball'],
  badge: '🏆 Sports Admin'
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gameopedia_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [authError, setAuthError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gameopedia_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gameopedia_user');
    }
  }, [currentUser]);

  const loginWithEmail = async (email, customName, customDept) => {
    setAuthError(null);
    if (!email || typeof email !== 'string') {
      setAuthError('Please provide a valid email address.');
      return false;
    }

    const trimmed = email.trim().toLowerCase();
    const domain = trimmed.split('@')[1];

    if (domain !== ALLOWED_DOMAIN) {
      setAuthError(`Access restricted. Only @${ALLOWED_DOMAIN} email accounts can sign up or access Gameopedia Sports Club.`);
      return false;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed })
      });

      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error || 'Login verification failed.');
        return false;
      }

      const user = data.user;
      if (customName) user.name = customName;
      if (customDept) user.department = customDept;

      setCurrentUser(user);
      setIsAuthModalOpen(false);
      return true;
    } catch (err) {
      // Fallback local auth if network delay
      const fallbackUser = {
        id: 'usr_' + Date.now(),
        name: customName || trimmed.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: trimmed,
        role: trimmed.includes('admin') || trimmed === 'aravind@gameopedia.com' ? 'admin' : 'user',
        department: customDept || 'Game Engineering',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${trimmed}`,
        badge: '⚡ Active Player'
      };
      setCurrentUser(fallbackUser);
      setIsAuthModalOpen(false);
      return true;
    }
  };

  const switchUser = (userObj) => {
    setCurrentUser(userObj);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin: currentUser?.role === 'admin' || currentUser?.email?.includes('admin'),
        authError,
        setAuthError,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithEmail,
        switchUser,
        logout,
        allowedDomain: ALLOWED_DOMAIN
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
