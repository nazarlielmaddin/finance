import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './ui';

export function Modal({ open, onClose, title, children, footer, width = 460 }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-[2px] animate-fade-in"
        style={{ background: 'color-mix(in oklab, var(--bg) 62%, transparent)' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-h-[90vh] flex-col bg-elevated rounded-lg shadow-float animate-scale-in"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between px-4 h-12 border-b border-line">
            <h2 className="text-[15px] font-semibold">{title}</h2>
            <IconButton onClick={onClose} label="Close" size={28}>
              <X size={16} />
            </IconButton>
          </div>
        )}
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3 border-t border-line">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, danger, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={400}
      footer={
        <>
          <button onClick={onClose} className="h-8 px-3 rounded-md text-[13px] font-medium text-ink-muted hover:bg-[var(--hover)]">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`h-8 px-3 rounded-md text-[13px] font-medium text-white disabled:opacity-50 ${danger ? 'bg-[#dc2626]' : 'bg-accent'}`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-[13px] text-ink-muted">{message}</p>
    </Modal>
  );
}
