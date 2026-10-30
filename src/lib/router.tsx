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

interface ParsedRoute {
  pathname: string;
  hash: string;
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  navigate: () => {},
  isPending: false,
});

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  let normalized = pathname;
  if (normalized.endsWith('/index.html')) {
    normalized = normalized.replace(/\/index\.html$/, '') || '/';
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.replace(/\/+$/, '') || '/';
  }
  return normalized || '/';
}

function parseRouteInput(to: string): ParsedRoute {
  if (typeof window === 'undefined') {
    const [pathname = '/', hash = ''] = to.replace(/^#/, '').split('#');
    return { pathname: normalizePathname(pathname || '/'), hash };
  }

  // Route portée par le hash (ex. #/services) — utilisée par certains exports statiques.
  if (to.startsWith('#/')) {
    const url = new URL(to.slice(1), window.location.origin);
    return {
      pathname: normalizePathname(url.pathname),
      hash: url.hash ? url.hash.slice(1) : '',
    };
  }

  // Ancre dans la page courante (ex. #partenaires).
  if (to.startsWith('#')) {
    return {
      pathname: normalizePathname(window.location.pathname || '/'),
      hash: to.slice(1),
    };
  }

  const url = new URL(to, window.location.origin);
  return {
    pathname: normalizePathname(url.pathname),
    hash: url.hash ? url.hash.slice(1) : '',
  };
}

function parseCurrentRoute(): ParsedRoute {
  if (typeof window === 'undefined') return { pathname: '/', hash: '' };

  if (window.location.hash.startsWith('#/')) {
    return parseRouteInput(window.location.hash);
  }

  return {
    pathname: normalizePathname(window.location.pathname || '/'),
    hash: window.location.hash ? window.location.hash.slice(1) : '',
  };
}

function parseCurrentPath(): string {
  return parseCurrentRoute().pathname;
}

/**
 * Fait défiler vers une ancre en réessayant brièvement : sur mobile, la page
 * cible (chargée en différé) peut ne pas encore être montée au premier essai.
 * Le décalage sous l'en-tête fixe est géré par `scroll-padding-top` en CSS.
 */
function scrollToAnchor(hash: string, attempt = 0) {
  if (typeof window === 'undefined' || !hash) return;

  let id = hash;
  try {
    id = decodeURIComponent(hash);
  } catch {
    // Garder la valeur brute si elle n'est pas encodée correctement.
  }

  const element = document.getElementById(id);
  if (element) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    return;
  }

  if (attempt < 14) {
    window.setTimeout(() => scrollToAnchor(hash, attempt + 1), 50);
  }
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(parseCurrentPath);
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback((to: string, options: NavigateOptions = { scrollToTop: true }) => {
    if (typeof window === 'undefined') return;

    const destination = parseRouteInput(to);
    const current = parseCurrentRoute();
    const isSameDestination =
      destination.pathname === current.pathname && destination.hash === current.hash;

    startTransition(() => {
      // Ne jamais empiler deux fois la même destination dans l'historique :
      // sinon le bouton « retour » du téléphone semble ne rien faire.
      if (options.replace || isSameDestination) {
        window.history.replaceState({}, '', to);
      } else {
        window.history.pushState({}, '', to);
      }
      setCurrentPath(destination.pathname);
    });

    if (destination.hash) {
      window.requestAnimationFrame(() => scrollToAnchor(destination.hash));
    } else if (options.scrollToTop !== false) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const handleLocationChange = () => {
      const route = parseCurrentRoute();
      setCurrentPath(route.pathname);
      if (route.hash) {
        window.requestAnimationFrame(() => scrollToAnchor(route.hash));
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    const initialRoute = parseCurrentRoute();
    if (initialRoute.hash) {
      window.requestAnimationFrame(() => scrollToAnchor(initialRoute.hash));
    }

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
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
  onClick?: (e?: React.MouseEvent<HTMLAnchorElement>) => void;
  title?: string;
  id?: string;
  ariaCurrent?: React.AriaAttributes['aria-current'];
  ariaLabel?: string;
}> = ({ href, className = '', children, onClick, title, id, ariaCurrent, ariaLabel }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onClick?.(e);
    navigate(href);
  };

  return (
    <a
      id={id}
      href={href}
      onClick={handleClick}
      className={className}
      title={title}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
};
