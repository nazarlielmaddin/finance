import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Drawer({ open, onClose, children, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 backdrop-blur-[2px] animate-fade-in"
        style={{ background: 'color-mix(in oklab, var(--bg) 55%, transparent)' }}
        onClick={onClose}
      />
      <div
        className="absolute top-0 right-0 h-full w-full bg-elevated shadow-float animate-slide-in-right flex flex-col"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
