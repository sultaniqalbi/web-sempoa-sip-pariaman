import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  categoryBadge?: string;
  icon?: string;
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
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  // Measure and scroll to the active target element
  const updateSpotlight = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.getElementById(currentStep.targetId);
    if (el) {
      // Scroll smoothly so element is centered
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

      // Delay small tick for scroll settlement
      const timer = setTimeout(() => {
        const bounding = el.getBoundingClientRect();
        const padding = 8; // padding around highlighted element
        setRect({
          top: Math.max(0, bounding.top - padding),
          left: Math.max(0, bounding.left - padding),
          width: bounding.width + padding * 2,
          height: bounding.height + padding * 2,
        });
      }, 150);

      return () => clearTimeout(timer);
    } else {
      // Fallback if target element not currently in DOM
      setRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      updateSpotlight();
      return () => clearTimeout(timer);
    } else {
      setCurrentStepIndex(0);
      setRect(null);
    }
  }, [isOpen, currentStepIndex, updateSpotlight]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleReposition = () => {
      if (!currentStep) return;
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

  // Determine popup position (Prefer below, or above if target is in bottom half of viewport)
  const isTargetInBottomHalf = rect ? rect.top > window.innerHeight * 0.55 : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Interaktif Portal Orang Tua"
      className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto"
    >
      {/* 1. Backdrop Overlay with Spotlight Cutout */}
      <div className="absolute inset-0 backdrop-blur-xs bg-slate-950/70 transition-opacity duration-300 pointer-events-none" />

      {rect && (
        <>
          {/* Spotlight Highlight Hole */}
          <div
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 20px 4px rgba(255, 112, 67, 0.6)',
            }}
            className="absolute rounded-2xl border-2 border-[#FF7043] transition-all duration-300 ease-out pointer-events-none z-10"
          />

          {/* Pulsing Beacon Dot Pointer */}
          <div
            style={{
              top: `${Math.max(10, rect.top - 12)}px`,
              left: `${Math.min(window.innerWidth - 30, rect.left + rect.width / 2 - 12)}px`,
            }}
            className="absolute z-20 flex items-center justify-center pointer-events-none"
          >
            <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-[#FF7043] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF7043] border-2 border-white shadow-md" />
          </div>
        </>
      )}

      {/* 2. Floating Guidance Card Popover */}
      <div
        ref={cardRef}
        style={{
          maxWidth: '440px',
        }}
        className={`fixed left-1/2 -translate-x-1/2 w-[92vw] sm:w-full z-30 transition-all duration-300 ease-out ${
          isTargetInBottomHalf ? 'top-6 sm:top-12' : 'bottom-6 sm:bottom-10'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-[#FFD8C7] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#FF7043] to-[#F4511E] px-5 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full">
                {currentStep.categoryBadge || 'Panduan Portal'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-white/90">
                {currentStepIndex + 1} / {steps.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors text-white text-xs font-bold cursor-pointer"
                title="Tutup Panduan"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-[#1E293B] leading-tight flex items-center gap-2">
                {currentStep.icon && <span>{currentStep.icon}</span>}
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
            <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] gap-2">
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
                  <span>{currentStepIndex === steps.length - 1 ? 'Selesai ✨' : 'Lanjut →'}</span>
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
