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

  // Measure and scroll smoothly to the target element
  const updateSpotlight = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      // Scroll into view centered
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

      // Calculate bounding rect after scroll movement starts/settles
      const measure = () => {
        const bounding = el.getBoundingClientRect();
        const padding = 8;
        setRect({
          top: Math.max(0, bounding.top - padding),
          left: Math.max(0, bounding.left - padding),
          width: bounding.width + padding * 2,
          height: bounding.height + padding * 2,
        });
      };

      measure();
      const timer1 = setTimeout(measure, 100);
      const timer2 = setTimeout(measure, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      updateSpotlight();
    } else {
      setCurrentStepIndex(0);
      setRect(null);
    }
  }, [isOpen, currentStepIndex, updateSpotlight]);

  // Window resize and scroll listener
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const handleReposition = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        const bounding = el.getBoundingClientRect();
        const padding = 8;
        setRect({
          top: Math.max(0, bounding.top - padding),
          left: Math.max(0, bounding.left - padding),
          width: bounding.width + padding * 2,
          height: bounding.height + padding * 2,
        });
      }
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, { passive: true });
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition);
    };
  }, [isOpen, currentStep]);

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
  // If target element is in bottom half (e.g. Bottom Nav tabs), place card ABOVE target with clear spacing.
  // If target is in top half (e.g. Header), place card BELOW target with clear spacing.
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isBottomTarget = rect ? rect.top > windowHeight * 0.45 : false;

  const cardStyle: React.CSSProperties = {
    maxWidth: '430px',
  };

  if (rect) {
    if (isBottomTarget) {
      // Place above target with minimum 16px safety
      const bottomPos = windowHeight - rect.top + 14;
      cardStyle.bottom = `${Math.min(windowHeight - 240, Math.max(16, bottomPos))}px`;
    } else {
      // Place below target with minimum 16px safety
      const topPos = rect.top + rect.height + 14;
      cardStyle.top = `${Math.min(windowHeight - 280, Math.max(16, topPos))}px`;
    }
  } else {
    // Default center placement when no rect is detected
    cardStyle.top = '50%';
    cardStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Interaktif Portal Orang Tua"
      className="fixed inset-0 z-[99999] overflow-hidden pointer-events-auto select-none"
    >
      {/* 1. Backdrop Overlay (Shading outside the spotlight hole) */}
      {!rect && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300 pointer-events-none" />
      )}

      {/* 2. Spotlight Cutout Window — Target element is 100% UNBLURRED and crystal clear */}
      {rect && (
        <>
          {/* Giant box-shadow cutout: Outside is dark shaded, inside is 100% clear and sharp */}
          <div
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.82), 0 0 25px 5px rgba(255, 112, 67, 0.65)',
            }}
            className="absolute rounded-2xl border-[3px] border-[#FF7043] transition-all duration-300 ease-out pointer-events-none z-10 animate-pulse"
          />

          {/* Glowing Beacon Pointer */}
          <div
            style={{
              top: isBottomTarget ? `${rect.top - 12}px` : `${rect.top + rect.height - 8}px`,
              left: `${Math.min(window.innerWidth - 30, Math.max(20, rect.left + rect.width / 2 - 8))}px`,
            }}
            className="absolute z-20 flex items-center justify-center pointer-events-none transition-all duration-300"
          >
            <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-[#FF7043] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF7043] border-2 border-white shadow-lg" />
          </div>
        </>
      )}

      {/* 3. Floating Guidance Popover Card — Dynamically repositioned without overlapping */}
      <div
        ref={cardRef}
        style={cardStyle}
        className={`fixed left-1/2 -translate-x-1/2 w-[92vw] sm:w-full z-30 transition-all duration-300 ease-out`}
      >
        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border-2 border-[#FF7043] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#FF7043] to-[#F4511E] px-4 sm:px-5 py-3.5 flex items-center justify-between text-white shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <LightbulbIcon size={18} className="text-white shrink-0" />
              <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full truncate">
                {currentStep.categoryBadge || 'Panduan Portal'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-black text-white/95 px-2 py-0.5 bg-black/15 rounded-full">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors text-white text-xs font-bold cursor-pointer"
                title="Tutup Panduan"
              >
                ✕
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
                  <span>{currentStepIndex === steps.length - 1 ? 'Selesai ✓' : 'Lanjut →'}</span>
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
