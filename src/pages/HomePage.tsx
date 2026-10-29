import React from 'react';
import { Hero } from '../components/Hero';
import { TrustStats } from '../components/TrustStats';
import { ServicesSection } from '../components/ServicesSection';
import { AboutPreview } from '../components/AboutPreview';
import { SectorExplorer } from '../components/SectorExplorer';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { RealisationsSection } from '../components/RealisationsSection';
import { PartnersSection } from '../components/PartnersSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { DigitalNewsSection } from '../components/DigitalNewsSection';
import { QuickContactSection } from '../components/QuickContactSection';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* 1. Hero Section */}
      <Hero />

      {/* 1.5. Chiffres clés & Réassurance */}
      <TrustStats />

      {/* 2. Services (Horizontal Carousel) */}
      <ServicesSection />

      {/* 3. Présentation de l'Entreprise */}
      <AboutPreview />

      {/* 4. Nos Solutions / Domaines d'Intervention (Horizontal Carousel) */}
      <SectorExplorer />

      {/* 5. Pourquoi Nous Choisir ? (4 Atouts Décisifs) */}
      <WhyChooseUs />

      {/* 6. Nos Réalisations (Horizontal Carousel) */}
      <RealisationsSection />

      {/* 7. Nos Partenaires (Horizontal Carousel) */}
      <PartnersSection />

      {/* 8. Témoignages / Avis (Horizontal Carousel) */}
      <TestimonialsSection />

      {/* 8.5. Actualités Digitales (Veille & 3 Derniers Articles de Blog) */}
      <DigitalNewsSection />

      {/* 9. Contact Rapide & Localisation */}
      <QuickContactSection />
    </div>
  );
};
