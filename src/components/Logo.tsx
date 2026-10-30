import React, { useState, useRef } from 'react';
import { useRouter } from '../lib/router';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onDoubleClick?: (e?: React.MouseEvent | React.TouchEvent) => void;
  /** Désactiver quand un parent gère déjà clic/double-tap (évite les doublons tactiles). */
  interactive?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showSubtitle = true,
  showText = true,
  size = 'md',
  onDoubleClick,
  interactive = true,
}) => {
  const { navigate } = useRouter();
  const [imageError, setImageError] = useState(false);
  const lastTapRef = useRef<number>(0);

  const triggerAdminAccess = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
    }
    if (onDoubleClick) {
      onDoubleClick(e);
    } else {
      navigate('/admin');
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    triggerAdminAccess(e);
  };

  // Double tap handler for touch devices (smartphones/tablets)
  const handleTouchEnd = (e: React.TouchEvent) => {
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapRef.current;

    // Detect double tap (between 40ms and 360ms interval)
    if (tapLength > 40 && tapLength < 360) {
      triggerAdminAccess(e);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = currentTime;
    }
  };

  const sizeClasses = {
    sm: { container: 'w-9 h-9', title: 'text-sm', sub: 'text-[8px]' },
    md: {
      container: 'w-10 h-10 min-[400px]:w-11 min-[400px]:h-11 sm:w-12 sm:h-12',
      title: 'text-[15px] min-[400px]:text-base sm:text-lg',
      sub: 'text-[8px] min-[400px]:text-[9px]',
    },
    lg: { container: 'w-16 h-16 sm:w-20 sm:h-20', title: 'text-xl sm:text-2xl', sub: 'text-[11px]' },
  }[size];

  return (
    <div
      onDoubleClick={interactive ? handleDoubleClick : undefined}
      onTouchEnd={interactive ? handleTouchEnd : undefined}
      title={
        interactive
          ? "Double-cliquez (ou double-tapez sur mobile) pour accéder à l'espace administrateur"
          : undefined
      }
      className={`flex min-w-0 items-center gap-2.5 min-[400px]:gap-3 select-none group ${interactive ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`relative ${sizeClasses.container} rounded-full bg-white shadow-md flex items-center justify-center border-2 border-[#D4AF37]/40 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all overflow-hidden flex-shrink-0 p-0.5`}
      >
        {imageError ? (
          <div className="w-full h-full rounded-full bg-[#01184C] flex items-center justify-center font-black text-[#D4AF37] text-xs">
            ES
          </div>
        ) : (
          <picture className="w-full h-full flex items-center justify-center">
            <source type="image/webp" srcSet="/logo-badge.webp" />
            <img
              src="/logo-badge.png"
              alt="Logo Officiel Excellence Services SARL"
              width={48}
              height={48}
              decoding="async"
              className="w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:scale-105"
              loading="eager"
              onError={() => setImageError(true)}
            />
          </picture>
        )}
      </div>

      {showText && (
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`font-black tracking-tight ${sizeClasses.title} text-[#01184C] dark:text-white leading-tight`}
            >
              EXCELLENCE
            </span>
            <span
              className={`font-black tracking-wider ${sizeClasses.title} text-[#D4AF37] leading-tight`}
            >
              SERVICES
            </span>
          </div>
          {showSubtitle && (
            <div
              className={`flex items-center gap-1.5 ${sizeClasses.sub} uppercase font-bold tracking-widest text-[#536582] dark:text-slate-400 mt-0.5`}
            >
              <span>SARL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span>Niamey, Niger</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
