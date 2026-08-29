import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LightbulbIcon } from './SvgIcons';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  categoryBadge?: string;
  icon?: React.ReactNode;
}

interface ProductTourModalProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const ProductTourModal: React.FC<ProductTourModalProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  // Lock body & document scroll completely while tour is active
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTouchAction = document.body.style.touchAction;
      const originalDocOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.documentElement.style.overflow = 'hidden';

      const preventScroll = (e: Event) => {
        // Allow clicks on buttons, but block wheel and touch scrolls
        if (e.type === 'wheel' || e.type === 'touchmove') {
          e.preventDefault();
        }
      };

      window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
      window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.touchAction = originalBodyTouchAction;
        document.documentElement.style.overflow = originalDocOverflow;
        window.removeEventListener('wheel', preventScroll, { capture: true });
        window.removeEventListener('touchmove', preventScroll, { capture: true });
      };
    }
  }, [isOpen]);

  // Measure and target element smoothly
  const updateSpotlight = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const measureElement = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        const bounding = el.getBoundingClientRect();
        const padding = 6;
        setRect({
          top: Math.max(0, bounding.top - padding),
          left: Math.max(0, bounding.left - padding),
          width: bounding.width + padding * 2,
          height: bounding.height + padding * 2,
        });
      } else {
        setRect(null);
      }
    };

    measureElement();
    const t = setTimeout(measureElement, 60);
    return () => clearTimeout(t);
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      const cleanup = updateSpotlight();
      return cleanup;
    } else {
      setCurrentStepIndex(0);
      setRect(null);
    }
  }, [isOpen, currentStepIndex, updateSpotlight]);

  // Window resize listener
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const handleReposition = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        const bounding = el.getBoundingClientRect();
        const padding = 6;
        setRect({
          top: Math.max(0, bounding.top - padding),
          left: Math.max(0, bounding.left - padding),
          width: bounding.width + padding * 2,
          height: bounding.height + padding * 2,
        });
      }
    };

    window.addEventListener('resize', handleReposition);
    return () => window.removeEventListener('resize', handleReposition);
  }, [isOpen, currentStep]);

  // Prevent wheel / touchmove scrolling on the backdrop
  const handleBackdropTouchMove = (e: React.TouchEvent | React.WheelEvent) => {
    e.preventDefault();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length]);

  if (!isOpen || !currentStep) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Smart Dynamic Card Placement:
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isBottomTarget = rect ? rect.top > windowHeight * 0.45 : false;

  const cardStyle: React.CSSProperties = {
    maxWidth: '420px',
  };

  if (rect) {
    if (isBottomTarget) {
      // Place above target with minimum 16px safety
      const bottomPos = windowHeight - rect.top + 16;
      cardStyle.bottom = `${Math.min(windowHeight - 220, Math.max(16, bottomPos))}px`;
    } else {
      // Place below target with minimum 16px safety
      const topPos = rect.top + rect.height + 16;
      cardStyle.top = `${Math.min(windowHeight - 260, Math.max(16, topPos))}px`;
    }
  } else {
    // Default center placement
    cardStyle.top = '50%';
    cardStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Interaktif Portal Orang Tua"
      onTouchMove={handleBackdropTouchMove}
      onWheel={handleBackdropTouchMove}
      className="fixed inset-0 z-[99999] overflow-hidden pointer-events-auto select-none touch-none"
    >
      {/* 1. CINEMATIC SPOTLIGHT CUTOUT PANELS */}
      {/* 4 surrounding panels with deep blur + slate overlay; Center hole has ZERO blur and 100% natural clarity */}
      {!rect ? (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300 pointer-events-none" />
      ) : (
        <>
          {/* Top Panel (Blurred & Dark) */}
          <div
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${rect.top}px`,
              transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute bg-slate-950/85 backdrop-blur-md pointer-events-none"
          />

          {/* Bottom Panel (Blurred & Dark) */}
          <div
            style={{
              top: `${rect.top + rect.height}px`,
              left: 0,
              right: 0,
              bottom: 0,
              transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute bg-slate-950/85 backdrop-blur-md pointer-events-none"
          />

          {/* Left Panel (Blurred & Dark) */}
          <div
            style={{
              top: `${rect.top}px`,
              left: 0,
              width: `${rect.left}px`,
              height: `${rect.height}px`,
              transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute bg-slate-950/85 backdrop-blur-md pointer-events-none"
          />

          {/* Right Panel (Blurred & Dark) */}
          <div
            style={{
              top: `${rect.top}px`,
              left: `${rect.left + rect.width}px`,
              right: 0,
              height: `${rect.height}px`,
              transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute bg-slate-950/85 backdrop-blur-md pointer-events-none"
          />

          {/* Glowing Illuminated Spotlight Frame — Steady, elegant, 100% crystal clear */}
          <div
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              boxShadow: '0 0 28px 4px rgba(255, 112, 67, 0.65), inset 0 0 10px rgba(255, 112, 67, 0.3)',
              transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute rounded-2xl border-2 border-[#FF7043] pointer-events-none z-10"
          />

          {/* Stationary Indicator Beacon */}
          <div
            style={{
              top: isBottomTarget ? `${rect.top - 10}px` : `${rect.top + rect.height - 6}px`,
              left: `${Math.min(window.innerWidth - 30, Math.max(20, rect.left + rect.width / 2 - 8))}px`,
              transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute z-20 flex items-center justify-center pointer-events-none"
          >
            <span className="h-4 w-4 rounded-full bg-[#FF7043] border-2 border-white shadow-lg flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
        </>
      )}

      {/* 2. Floating Guidance Popover Card */}
      <div
        ref={cardRef}
        style={{
          ...cardStyle,
          transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="fixed left-1/2 -translate-x-1/2 w-[92vw] sm:w-full z-30 pointer-events-auto"
      >
        <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] border-2 border-[#FF7043] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#FF7043] to-[#F4511E] px-4 sm:px-5 py-3.5 flex items-center justify-between text-white shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <LightbulbIcon size={18} className="text-white shrink-0" />
              <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full truncate">
                {currentStep.categoryBadge || 'Panduan Portal'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-black text-white/95 px-2.5 py-0.5 bg-black/20 rounded-full">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors text-white text-xs font-bold cursor-pointer"
                title="Tutup Panduan"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#1E293B] leading-tight flex items-center gap-2">
                {currentStep.icon && <span className="shrink-0">{currentStep.icon}</span>}
                <span>{currentStep.title}</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-medium">
                {currentStep.description}
              </p>
            </div>

            {/* Progress Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[#FF7043]'
                      : idx < currentStepIndex
                      ? 'w-2 bg-[#FFAB91]'
                      : 'w-2 bg-[#E2E8F0]'
                  }`}
                  aria-label={`Lompat ke langkah ${idx + 1}`}
                />
              ))}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#F1F5F9] gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#94A3B8] hover:text-[#64748B] font-bold px-2 py-1.5 transition-colors cursor-pointer"
              >
                Lewati Tur
              </button>

              <div className="flex items-center gap-2">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-3.5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-bold text-xs rounded-xl border border-[#CBD5E1] transition-all cursor-pointer active:scale-95"
                  >
                    Kembali
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF7043] to-[#F4511E] hover:from-[#F4511E] hover:to-[#E64A19] text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      <span>Selesai</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Lanjut</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTourModal;
