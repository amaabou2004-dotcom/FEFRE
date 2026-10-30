import React, { useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { VoicePhase } from '../../lib/voice/VoiceAssistantContext';

/**
 * ISA — Orbe vocal
 * ================
 * L'élément visuel central, inspiré de Siri : une sphère lumineuse qui
 * « respire » au repos, ondule avec le niveau sonore pendant l'écoute, tourne
 * pendant la réflexion et pulse quand l'assistant parle.
 *
 * 100 % CSS/SVG + `motion` : aucun asset lourd, donc fluide même sur un
 * téléphone d'entrée de gamme en 3G à Niamey.
 */

interface VoiceOrbProps {
  phase: VoicePhase;
  /** Niveau sonore instantané (0 → 1) pendant l'écoute. */
  level?: number;
  size?: number;
  onClick?: () => void;
  label?: string;
}

const PHASE_COLORS: Record<VoicePhase, { core: string; glow: string; ring: string }> = {
  idle: { core: '#2E6BFF', glow: '#7AA8FF', ring: '#D4AF37' },
  listening: { core: '#D4AF37', glow: '#F3D98B', ring: '#FFFFFF' },
  transcribing: { core: '#22B8A6', glow: '#8FF0E3', ring: '#D4AF37' },
  thinking: { core: '#7C5CFF', glow: '#B9A6FF', ring: '#D4AF37' },
  speaking: { core: '#22C55E', glow: '#A7F3C9', ring: '#FFFFFF' },
  error: { core: '#EF4444', glow: '#FCA5A5', ring: '#FFFFFF' },
};

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ phase, level = 0, size = 220, onClick, label }) => {
  const reducedMotion = useReducedMotion();
  const colors = PHASE_COLORS[phase] || PHASE_COLORS.idle;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(level);
  const phaseRef = useRef(phase);
  const rafRef = useRef<number | null>(null);

  levelRef.current = level;
  phaseRef.current = phase;

  const isInteractive = Boolean(onClick);
  const scale = useMemo(() => {
    if (reducedMotion) return 1;
    switch (phase) {
      case 'listening':
        return 1 + Math.min(0.16, level * 0.35);
      case 'thinking':
      case 'transcribing':
        return 1.04;
      case 'speaking':
        return 1.08;
      case 'error':
        return 0.98;
      default:
        return 1;
    }
  }, [level, phase, reducedMotion]);

  /**
   * Vagues internes dessinées en canvas pendant l'écoute : réagit au micro en
   * temps réel, comme Siri. Désactivé si l'utilisateur limite les animations.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion || phase !== 'listening') return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    context.scale(dpr, dpr);

    let frame = 0;
    const draw = () => {
      const currentPhase = phaseRef.current;
      const currentLevel = levelRef.current;
      context.clearRect(0, 0, size, size);
      const center = size / 2;
      const amplitude = 6 + currentLevel * 26;

      for (let wave = 0; wave < 3; wave += 1) {
        context.beginPath();
        const phaseShift = frame / (26 + wave * 9) + wave * 1.1;
        for (let x = 0; x <= size; x += 3) {
          const normalized = (x / size) * Math.PI * 2;
          const envelope = Math.sin((x / size) * Math.PI);
          const y = center + Math.sin(normalized * 2 + phaseShift) * amplitude * envelope * (1 - wave * 0.22);
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle =
          currentPhase === 'listening'
            ? `rgba(212, 175, 55, ${0.5 - wave * 0.13})`
            : `rgba(122, 168, 255, ${0.34 - wave * 0.1})`;
        context.lineWidth = 2 - wave * 0.4;
        context.stroke();
      }

      frame += 1;
      rafRef.current = window.requestAnimationFrame(draw);
    };

    rafRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      context.clearRect(0, 0, size, size);
    };
  }, [phase, reducedMotion, size]);

  return (
    <motion.button
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      aria-label={label}
      aria-live="polite"
      disabled={!isInteractive}
      animate={{ scale }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative grid place-items-center rounded-full outline-none ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ width: size, height: size }}
    >
      {/* Halo externe */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${colors.glow}55 0%, ${colors.core}22 42%, transparent 70%)`,
          filter: 'blur(6px)',
        }}
        animate={
          reducedMotion
            ? undefined
            : {
                opacity: phase === 'idle' ? [0.55, 0.9, 0.55] : [0.8, 1, 0.8],
                scale: phase === 'speaking' ? [1, 1.07, 1] : [1, 1.03, 1],
              }
        }
        transition={{ duration: phase === 'listening' ? 0.9 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Anneaux concentriques (écoute / parole) */}
      {(phase === 'listening' || phase === 'speaking') &&
        !reducedMotion &&
        [0, 1, 2].map((index) => (
          <motion.span
            key={index}
            aria-hidden="true"
            className="absolute rounded-full border"
            style={{ borderColor: `${colors.ring}55`, width: size * 0.72, height: size * 0.72 }}
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2.1, repeat: Infinity, delay: index * 0.6, ease: 'easeOut' }}
          />
        ))}

      {/* Sphère principale */}
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${colors.glow} 22%, ${colors.core} 62%, #01184C 100%)`,
          boxShadow: `0 0 ${size * 0.28}px ${colors.core}66, inset 0 -${size * 0.06}px ${size * 0.16}px rgba(1,24,76,0.55)`,
        }}
      />

      {/* Vagues du microphone */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute rounded-full"
        style={{ width: size * 0.62, height: size * 0.62, opacity: phase === 'listening' ? 1 : 0, transition: 'opacity 220ms' }}
      />

      {/* Rotation de réflexion */}
      {(phase === 'thinking' || phase === 'transcribing') && !reducedMotion && (
        <motion.span
          aria-hidden="true"
          className="absolute rounded-full border-2 border-transparent"
          style={{
            width: size * 0.74,
            height: size * 0.74,
            borderTopColor: colors.ring,
            borderRightColor: `${colors.ring}55`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <span className="sr-only">{label}</span>
    </motion.button>
  );
};

export default VoiceOrb;
