import { useEffect } from 'react';
import { useAuth } from './useAuth';

export function useOnlineStatus() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Send heartbeat every 30 seconds to maintain online status
    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch('/api/users/heartbeat', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000);

    // Set user offline when page is about to unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for better reliability when page is closing
      navigator.sendBeacon('/api/users/heartbeat', JSON.stringify({ offline: true }));
    };

    // Set user offline when page becomes hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        navigator.sendBeacon('/api/users/heartbeat', JSON.stringify({ offline: true }));
      } else if (document.visibilityState === 'visible') {
        // Send heartbeat when page becomes visible again
        fetch('/api/users/heartbeat', {
          method: 'POST',
          credentials: 'include',
        }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);
}