import React from 'react';
import { RealisationsSection } from '../components/RealisationsSection';

export const RealisationsPage: React.FC = () => {
  return (
    <div className="pt-32 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300 min-h-[80vh]">
      <RealisationsSection isStandalonePage={true} />
    </div>
  );
};
