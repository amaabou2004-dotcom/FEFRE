import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react';

interface NavigateOptions {
  replace?: boolean;
  scrollToTop?: boolean;
}

interface RouterContextType {
  currentPath: string;
  navigate: (to: string, options?: NavigateOptions) => void;
  isPending: boolean;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
  isPending: false,
});

function parseCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    return window.location.hash.slice(1);
  }
  let p = window.location.pathname || '/';
  if (p.endsWith('/index.html')) {
    p = p.replace(/\/index\.html$/, '') || '/';
  }
  return p || '/';
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(parseCurrentPath);
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback((to: string, options: NavigateOptions = { scrollToTop: true }) => {
    startTransition(() => {
      if (options.replace) {
        window.history.replaceState({}, '', to);
      } else {
        window.history.pushState({}, '', to);
      }
      setCurrentPath(to);
    });

    // Check if navigating to a hash anchor (e.g. /#partenaires or #partenaires)
    if (to.includes('#') && !to.startsWith('#/')) {
      const hash = to.split('#')[1];
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }, 60);
      }
    } else if (options.scrollToTop !== false) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(parseCurrentPath());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate, isPending }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export const Link: React.FC<{
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  title?: string;
  id?: string;
}> = ({ href, className = '', children, onClick, title, id }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.(e);
    navigate(href);
  };

  return (
    <a id={id} href={href} onClick={handleClick} className={className} title={title}>
      {children}
    </a>
  );
};
