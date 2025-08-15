import { useState, useEffect } from 'react';

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Force desktop for screens wider than 1024px
      const isDesktop = width >= 1024;
      const isMobile = width < 1024;
      
      setScreenSize({
        width,
        height,
        isDesktop,
        isMobile,
      });
      
      // Force desktop layout classes on large screens
      if (isDesktop) {
        document.body.classList.add('force-desktop-layout');
        document.documentElement.style.setProperty('--is-desktop', '1');
        // Prevent mobile viewport scaling
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=1024, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      } else {
        document.body.classList.remove('force-desktop-layout');
        document.documentElement.style.setProperty('--is-desktop', '0');
        // Allow mobile viewport scaling
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
        }
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return screenSize;
}