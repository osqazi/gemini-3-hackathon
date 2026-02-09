'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GuestModeContextType {
  isGuest: boolean;
  guestId: string | null;
  setGuestMode: (enabled: boolean) => void;
  getGuestPreferences: () => any;
  saveGuestPreferences: (prefs: any) => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function GuestModeProvider({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is in guest mode
    const guestMode = localStorage.getItem('guestMode') === 'true';
    const storedGuestId = localStorage.getItem('guestId');

    if (guestMode && storedGuestId) {
      setIsGuest(true);
      setGuestId(storedGuestId);
    }
  }, []);

  const setGuestMode = (enabled: boolean) => {
    if (enabled) {
      // Generate a guest ID if one doesn't exist
      let currentGuestId = localStorage.getItem('guestId');
      if (!currentGuestId) {
        currentGuestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guestId', currentGuestId);
      }

      localStorage.setItem('guestMode', 'true');
      setIsGuest(true);
      setGuestId(currentGuestId);
    } else {
      localStorage.removeItem('guestMode');
      localStorage.removeItem('guestId');
      setIsGuest(false);
      setGuestId(null);
    }
  };

  const getGuestPreferences = () => {
    if (!isGuest) return {};
    const prefs = localStorage.getItem('guestPreferences');
    return prefs ? JSON.parse(prefs) : {};
  };

  const saveGuestPreferences = (prefs: any) => {
    if (isGuest) {
      localStorage.setItem('guestPreferences', JSON.stringify(prefs));
    }
  };

  return (
    <GuestModeContext.Provider value={{
      isGuest,
      guestId,
      setGuestMode,
      getGuestPreferences,
      saveGuestPreferences
    }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
}

// Guest mode toggle component
export function GuestModeToggle() {
  const { isGuest, setGuestMode } = useGuestMode();
  const router = useRouter();

  const toggleGuestMode = () => {
    if (isGuest) {
      // Switching from guest to logged in
      setGuestMode(false);
      router.push('/auth/signin');
    } else {
      // Switching to guest mode
      setGuestMode(true);
      router.push('/chat');
    }
  };

  return (
    <button
      onClick={toggleGuestMode}
      className={`px-4 py-2 rounded-md font-medium ${
        isGuest
          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      }`}
    >
      {isGuest ? 'Continue as Guest' : 'Try as Guest'}
    </button>
  );
}