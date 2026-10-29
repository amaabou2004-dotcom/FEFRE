import React, { useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RouterProvider, useRouter } from './lib/router';
import { DataProvider } from './lib/DataContext';
import { AuthProvider } from './lib/AuthContext';
import { useTheme, ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useLanguage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AIAssistantFloatingButton } from './components/AIAssistantFloatingButton';
import { BackToTop } from './components/BackToTop';
import { CustomCursor } from './components/CustomCursor';

import { ErrorBoundary } from './components/ErrorBoundary';
import { PageProgressBar } from './components/PageProgressBar';

// Eagerly loaded for instant initial landing paint
import { HomePage } from './pages/HomePage';

// Code-split secondary routes to shrink initial bundle and accelerate mobile loading
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })));
const SectorsPage = lazy(() => import('./pages/SectorsPage').then((m) => ({ default: m.SectorsPage })));
const RealisationsPage = lazy(() => import('./pages/RealisationsPage').then((m) => ({ default: m.RealisationsPage })));
const ActualitesPage = lazy(() => import('./pages/ActualitesPage').then((m) => ({ default: m.ActualitesPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const DevisPage = lazy(() => import('./pages/DevisPage').then((m) => ({ default: m.DevisPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const PartnerPortalPage = lazy(() => import('./pages/PartnerPortalPage').then((m) => ({ default: m.PartnerPortalPage })));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })));
const DownloadPage = lazy(() => import('./pages/DownloadPage').then((m) => ({ default: m.DownloadPage })));

const RouteLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center py-20" aria-label="Chargement de la page">
    <div className="w-9 h-9 border-3 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Scroll to top upon route change smoothly (must run unconditionally before any early return)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentPath]);

  // Admin dedicated workspace (no public navbar/footer overlay)
  if (currentPath.startsWith('/admin')) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminPage />
      </Suspense>
    );
  }

  // AI Assistant Full Page (100vw x 100dvh dedicated application workspace)
  if (currentPath === '/assistant-ia' || currentPath === '/ia') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AIAssistantPage />
      </Suspense>
    );
  }

  // Route Dispatcher for Public Site
  const renderRoute = () => {
    if (currentPath === '/' || currentPath === '') {
      return <HomePage />;
    }
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        {(() => {
          if (currentPath === '/a-propos') {
            return <AboutPage />;
          }
          if (currentPath === '/services') {
            return <ServicesPage />;
          }
          if (currentPath.startsWith('/services/')) {
            const slug = currentPath.replace('/services/', '').replace(/\/$/, '');
            return <ServiceDetailPage slug={slug} />;
          }
          if (currentPath === '/secteurs') {
            return <SectorsPage />;
          }
          if (currentPath === '/realisations') {
            return <RealisationsPage />;
          }
          if (currentPath === '/actualites') {
            return <ActualitesPage />;
          }
          if (currentPath === '/contact') {
            return <ContactPage />;
          }
          if (currentPath === '/devis') {
            return <DevisPage />;
          }
          if (currentPath === '/espace-partenaire' || currentPath === '/partenaires') {
            return <PartnerPortalPage />;
          }
          if (
            currentPath === '/telechargement' ||
            currentPath === '/telechargements' ||
            currentPath === '/export-cpanel' ||
            currentPath === '/telecharger'
          ) {
            return <DownloadPage />;
          }
          return <HomePage />;
        })()}
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFD] dark:bg-[#030F26] text-[#0E1D38] dark:text-white transition-colors duration-300 font-sans selection:bg-[#D4AF37] selection:text-[#01184C]">
      {/* Subtle Custom Cursor for desktop precision */}
      <CustomCursor />

      {/* Smooth reading & route transition indicator */}
      <PageProgressBar />

      {/* Main Navigation */}
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Page View with Fluid Page Transitions */}
      <main id="main-content" className="flex-1 w-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex-1"
          >
            {renderRoute()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Floating Actions */}
      <BackToTop />
      <AIAssistantFloatingButton />
      <WhatsAppButton />

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <RouterProvider>
            <DataProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </DataProvider>
          </RouterProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
