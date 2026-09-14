import { forwardRef, useRef, useLayoutEffect } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { initials, avatarStyle } from '../lib/format';
import { isSuleyman, isFinanceDev } from '../lib/roleStyle';

// ── Button ───────────────────────────────────────────────
export function Button({ variant = 'secondary', size = 'md', className, loading, children, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 ease-out-quint disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap';
  const sizes = { sm: 'h-7 px-2.5 text-[13px]', md: 'h-8 px-3 text-[13px]', lg: 'h-9 px-4 text-sm' };
  const variants = {
    primary: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95',
    secondary: 'bg-surface text-ink shadow-ring hover:bg-[var(--hover)]',
    ghost: 'text-ink-muted hover:bg-[var(--hover)] hover:text-ink',
    soft: 'bg-accent-weak text-accent-text hover:brightness-105',
    danger: 'bg-[#dc2626] text-white hover:brightness-110',
  };
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], 'mo-press', variant === 'primary' && 'mo-glow', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconButton({ className, children, size = 32, label, ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-md text-ink-muted hover:bg-[var(--hover)] hover:text-ink transition-colors mo-press',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Avatar ───────────────────────────────────────────────
export function Avatar({ name, src, id, size = 28, className }) {
  const inner = src ? (
    <img src={src} alt={name || ''} className={clsx('rounded-full object-cover mo-ava', className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={clsx('inline-flex items-center justify-center rounded-full font-medium leading-none mo-ava', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), ...avatarStyle(id ?? name) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
  // Süleyman's avatar carries a red-neon ring + thin lightning on hover, everywhere it appears.
  // Bound strictly to his account id — not to anyone sharing his name.
  if (isSuleyman({ id })) {
    return (
      <span className="appina-sul-avatar relative inline-flex shrink-0">
        <span className="appina-sul-avatar__bolt a" aria-hidden="true" />
        <span className="appina-sul-avatar__bolt b" aria-hidden="true" />
        <span className="appina-sul-avatar__bolt c" aria-hidden="true" />
        {inner}
      </span>
    );
  }
  // Elməddin (finance developer) — animated blue-neon ring everywhere, brighter on hover.
  if (isFinanceDev({ id })) {
    return <span className="appina-fin-avatar relative inline-flex shrink-0">{inner}</span>;
  }
  return inner;
}

// ── Spinner / EmptyState ─────────────────────────────────
export function Spinner({ size = 16, className }) {
  return <Loader2 size={size} className={clsx('animate-spin text-ink-faint', className)} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={22} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {Icon && <Icon size={26} className="text-ink-faint mb-3" strokeWidth={1.5} />}
      <p className="text-ink-muted text-sm">{title}</p>
      {children && <p className="text-ink-faint text-[13px] mt-1 max-w-sm">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Form controls ────────────────────────────────────────
const fieldBase =
  'rounded-md bg-surface text-ink placeholder:text-ink-faint shadow-ring px-2.5 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-accent transition-shadow';
// Width-aware: default to full width unless the caller passes an explicit w-* class.
const hasWidth = (cls) => /(?:^|\s)(?:w-|min-w-|max-w-|flex-1)/.test(cls || '');

export function Field({ label, hint, error, required, children, className }) {
  return (
    <label className={clsx('block', className)}>
      {label && (
        <span className="block text-xs font-medium text-ink-muted mb-1.5">
          {label}
          {required && <span className="text-[#dc2626]"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-[#dc2626] mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-ink-faint mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx(fieldBase, !hasWidth(className) && 'w-full', className)} {...props} />;
});

// autoGrow: поле растёт под текст (до 60% высоты экрана), чтобы длинный комментарий
// или описание не сжимались в маленькое окошко с внутренней прокруткой.
export const Textarea = forwardRef(function Textarea({ className, autoGrow, onChange, value, ...props }, ref) {
  const inner = useRef(null);
  const setRefs = (el) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  const fit = () => {
    const el = inner.current;
    if (!el || !autoGrow) return;
    el.style.height = 'auto';
    const max = Math.round(window.innerHeight * 0.6);
    el.style.height = Math.min(el.scrollHeight + 2, max) + 'px';
    el.style.overflowY = el.scrollHeight + 2 > max ? 'auto' : 'hidden';
  };
  useLayoutEffect(fit, [value, autoGrow]);
  return (
    <textarea
      ref={setRefs}
      value={value}
      onChange={(e) => { onChange?.(e); fit(); }}
      className={clsx(fieldBase, 'min-h-[84px] leading-relaxed', autoGrow ? 'resize-none' : 'resize-y', !hasWidth(className) && 'w-full', className)}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(fieldBase, 'appearance-none pr-8 cursor-pointer', !hasWidth(className) && 'w-full', className)}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Badges (priority / status) ───────────────────────────
export function StatusDot({ status, className }) {
  return <span className={clsx('dot', `stat-${status}`, className)} />;
}

export function PriorityBadge({ priority, className }) {
  const { t } = useTranslation();
  return (
    <span className={clsx('badge', `prio-${priority}`, className)}>
      <span className="dot" />
      {t(`priority.${priority}`)}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const { t } = useTranslation();
  return (
    <span className={clsx('badge', `stat-${status}`, className)}>
      <span className="dot" />
      {t(`status.${status}`)}
    </span>
  );
}

export function Chip({ children, className, color }) {
  return (
    <span className={clsx('badge', className)} style={color ? { color, background: 'var(--hover)' } : undefined}>
      {children}
    </span>
  );
}

// ── Progress ─────────────────────────────────────────────
export function Progress({ value = 0, className, tone = 'accent' }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={clsx('mo-progress h-1.5 rounded-full bg-[var(--hover)] overflow-hidden', className)}>
      <div
        className={clsx('h-full rounded-full transition-[width] duration-500 ease-out-quint',
          tone === 'accent' ? 'bg-accent' : '', v > 0 && v < 100 && 'mo-progress-sheen')}
        style={{ width: `${v}%`, background: tone !== 'accent' ? tone : undefined }}
      />
    </div>
  );
}

// ── Segmented control ────────────────────────────────────
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={clsx('inline-flex items-center gap-0.5 rounded-md bg-[var(--hover)] p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'px-2.5 h-7 rounded text-[13px] font-medium transition-colors',
            value === o.value ? 'bg-surface text-ink shadow-ring' : 'text-ink-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────
export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('bg-surface rounded-lg shadow-card', className)} {...props}>
      {children}
    </div>
  );
}


// Скелет строки списка: вместо пустоты — перелив, пока данные едут.
export function SkeletonRow({ rows = 5, height = 40 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mo-skeleton mo-rise mo-stagger" style={{ height, '--i': i }} />
      ))}
    </div>
  );
}
