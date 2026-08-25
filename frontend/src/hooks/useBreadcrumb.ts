import { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function useBreadcrumb(items: BreadcrumbItem[]) {
  useEffect(() => {
    const id = 'breadcrumb-jsonld';
    let script = document.getElementById(id) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: `https://sempoasippariaman.com${item.path === '/' ? '' : item.path}`,
      })),
    });

    return () => {
      if (script && script.parentNode) {
        script.remove();
      }
    };
  }, [items]);
}

export default useBreadcrumb;
