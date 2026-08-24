import { useEffect } from 'react';

/**
 * Dynamically injects FontAwesome stylesheet ONLY when authenticated layouts mount.
 * This keeps public pages 100% free of FontAwesome webfont payloads (~192 KiB saved).
 */
export const useAuthenticatedFontAwesome = () => {
  useEffect(() => {
    const id = 'fa-authenticated-stylesheet';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);
};
