import React, { useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { RouterProvider, useRouter } from './lib/router';
import { DataProvider } from './lib/DataContext';
import { AuthProvider } from './lib/AuthContext';
import { AIChatProvider } from './lib/AIChatContext';
import { useTheme, ThemeProvider } from './hooks/useTheme';
import { LanguageProvider } from './hooks/useLanguage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AIAssistantFloatingButton } from './components/AIAssistantFloatingButton';
import { VoiceAssistantFloatingButton } from './components/voice/VoiceAssistantFloatingButton';
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
const VoiceAssistantPage = lazy(() => import('./pages/VoiceAssistantPage').then((m) => ({ default: m.VoiceAssistantPage })));
const DownloadPage = lazy(() => import('./pages/DownloadPage').then((m) => ({ default: m.DownloadPage })));

const RouteLoadingFallback = () => (
  <div className="min-h-[60dvh] flex items-center justify-center py-20" aria-label="Chargement de la page">
    <div className="w-9 h-9 border-3 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

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

  // ISA — Assistant vocal plein écran (Siri-like : zarma / haoussa / français)
  if (currentPath === '/assistant-vocal' || currentPath === '/vocal' || currentPath === '/isa') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <VoiceAssistantPage />
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
    <div className="min-h-dvh flex flex-col bg-[#F8FAFD] dark:bg-[#030F26] text-[#0E1D38] dark:text-white transition-colors duration-300 font-sans selection:bg-[#D4AF37] selection:text-[#01184C]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-[#D4AF37] focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-[#01184C] focus:shadow-xl"
      >
        Aller au contenu principal
      </a>

      {/* Subtle Custom Cursor for desktop precision */}
      <CustomCursor />

      {/* Smooth reading & route transition indicator */}
      <PageProgressBar />

      {/* Main Navigation */}
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Page View with Fluid Page Transitions */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-full overflow-x-clip outline-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="w-full flex-1"
          >
            {renderRoute()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Floating Actions */}
      <BackToTop />
      <AIAssistantFloatingButton />
      <VoiceAssistantFloatingButton />
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
                <AIChatProvider>
                  <AppContent />
                </AIChatProvider>
              </AuthProvider>
            </DataProvider>
          </RouterProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
