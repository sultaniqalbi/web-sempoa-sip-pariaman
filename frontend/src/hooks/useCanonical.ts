import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useCanonical() {
  const location = useLocation();

  useEffect(() => {
    const url = `https://sempoasippariaman.com${location.pathname === '/' ? '/' : location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [location.pathname]);
}

export default useCanonical;
