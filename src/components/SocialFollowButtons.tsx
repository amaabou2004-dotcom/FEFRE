import React from 'react';
import { Facebook, Music2 } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';

interface SocialFollowButtonsProps {
  showTitle?: boolean;
  title?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SocialFollowButtons: React.FC<SocialFollowButtonsProps> = ({
  showTitle = true,
  title = 'Suivez-nous',
  className = '',
  buttonClassName = '',
  size = 'md',
}) => {
  const { settings } = useSiteData();

  const facebookUrl =
    settings.facebook || 'https://www.facebook.com/share/18nx1djJnt/?mibextid=wwXIfr';
  const tiktokUrl =
    settings.tiktok || 'https://www.tiktok.com/@excellenceservices?_r=1&_t=ZS-99nADDdMPcS';

  const sizeClasses = {
    sm: 'py-2.5 px-3 text-xs gap-2',
    md: 'py-3.5 px-4 text-xs sm:text-sm gap-2.5',
    lg: 'py-4 px-5 text-sm sm:text-base gap-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  };

  return (
    <div className={`w-full ${className}`}>
      {showTitle && (
        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-3">
          {title}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* Facebook Button */}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Suivre Excellence Services SARL sur Facebook"
          className={`flex items-center justify-center rounded-2xl bg-[#07193F] hover:bg-[#0C2456] dark:bg-[#07193F] dark:hover:bg-[#0C2456] border border-[#1B3E82]/80 hover:border-[#2A5EB8] text-white font-extrabold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group cursor-pointer ${sizeClasses[size]} ${buttonClassName}`}
        >
          <div className="flex items-center justify-center text-[#1877F2] group-hover:scale-110 transition-transform shrink-0">
            <Facebook className={`${iconSizes[size]} fill-current`} />
          </div>
          <span className="truncate">Facebook</span>
        </a>

        {/* TikTok Button */}
        <a
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Suivre Excellence Services SARL sur TikTok"
          className={`flex items-center justify-center rounded-2xl bg-[#07193F] hover:bg-[#0C2456] dark:bg-[#07193F] dark:hover:bg-[#0C2456] border border-[#1B3E82]/80 hover:border-[#2A5EB8] text-white font-extrabold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group cursor-pointer ${sizeClasses[size]} ${buttonClassName}`}
        >
          <div className="flex items-center justify-center text-[#FE2C55] group-hover:scale-110 transition-transform shrink-0">
            <Music2 className={`${iconSizes[size]} fill-current`} />
          </div>
          <span className="truncate">TikTok</span>
        </a>
      </div>
    </div>
  );
};
