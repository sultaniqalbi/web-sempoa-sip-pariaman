import { useEffect } from 'react';

export function useSeoMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: string, val: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('meta[name="title"]', 'name', 'title', title);
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    setMeta('meta[property="twitter:title"]', 'property', 'twitter:title', title);
    setMeta('meta[property="twitter:description"]', 'property', 'twitter:description', description);
    setMeta('meta[property="twitter:url"]', 'property', 'twitter:url', window.location.href);
  }, [title, description]);
}

export default useSeoMeta;
