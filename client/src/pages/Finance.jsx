import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE } from '../lib/api';
import { useAuth } from '../lib/store';
import { isFullAccess } from '../lib/constants';
import { PhoneActions, EmailActions } from '../components/ContactActions';
import {
  Lock, Wallet, TrendingDown, Layers, ShieldCheck, CheckCircle2,
  LayoutDashboard, BadgeDollarSign, Wrench, FileText, Phone, Car, ShoppingCart, ExternalLink,
  Sparkles, ArrowUp, Plus, Pencil, Trash2, X, Search, Download, Banknote, Image as ImageIcon,
  PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2, Check, Zap, Brain, Terminal, Cpu, Paperclip, Upload,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';

// Original finance-app palette: emerald primary + blue/purple ambient.
const EM = '#10b981';
const EM2 = '#10b981';   // bright emerald — readable on dark AND light backgrounds
const BLUE = '#3b82f6';

const money = (n) =>
  Number(n || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₼';
// Finance dates are stored as DD.MM.YYYY — convert to/from the <input type=date> ISO format.
const toISO = (d) => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : (d || ''); };
const fromISO = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${m[3]}.${m[2]}.${m[1]}` : (d || ''); };

const FIN_STYLE = `
.fin-app{position:relative}
.fin-full{position:fixed!important;inset:0;z-index:60;background:var(--bg)}
.fin-app::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;
 background-image:radial-gradient(48rem 48rem at 8% -10%,rgba(16,185,129,.05),transparent 60%),radial-gradient(42rem 42rem at 100% 0,rgba(59,130,246,.04),transparent 55%)}
.fin-app>*{position:relative;z-index:1}
.fin-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 6px 22px -16px rgba(20,40,60,.20);transition:box-shadow .2s,border-color .2s}
.fin-card.hov:hover{border-color:rgba(16,185,129,.40);box-shadow:0 12px 28px -16px rgba(16,185,129,.22)}
.fin-app tbody tr:hover{background:rgba(16,185,129,.06)}
.fin-statussel{appearance:none;cursor:pointer;border-radius:9999px;padding:2px 22px 2px 10px;font-size:11px;font-weight:600;border:1px solid var(--line);background:var(--bg);background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 11px) 50%,calc(100% - 7px) 50%;background-size:4px 4px,4px 4px;background-repeat:no-repeat}
.fin-grad{background:linear-gradient(90deg,#10b981,#3b82f6,#8b5cf6,#10b981);background-size:240% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:finG 5s linear infinite}
@keyframes finG{to{background-position:-240% center}}
.fin-rise{animation:finR .5s cubic-bezier(.2,.7,.2,1) both}
@keyframes finR{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.fin-orb{animation:finO 2.4s ease-in-out infinite}
@keyframes finO{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45)}50%{box-shadow:0 0 36px 6px rgba(16,185,129,.25)}}
.fin-app .space-y-6>*+*{margin-top:.75rem}
.fin-app .space-y-3>*+*{margin-top:.5rem}
.fin-app .gap-4{gap:.75rem}
.fin-app .gap-3\.5{gap:.625rem}
.fin-app .p-5{padding:1rem}
.fin-app .mb-4{margin-bottom:.5rem}
.fin-app .py-3{padding-top:.5rem;padding-bottom:.5rem}
.fin-app .pt-5{padding-top:.75rem}
`;
const Style = () => <style dangerouslySetInnerHTML={{ __html: FIN_STYLE }} />;

export function FinanceLocked() {
  return (
    <div className="fin-app flex-1 grid place-items-center p-6 min-h-[70vh]">
      <Style />
      <div className="fin-card fin-rise px-9 py-12 max-w-md text-center">
        <div className="fin-orb mx-auto mb-6 grid size-16 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>
          <Lock size={30} />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight fin-grad">Giriş qadağandır</h2>
        <p className="mt-3 text-sm text-ink-faint">Bu bölmə — <b>Appina Finance Management</b>.<br />Sizə giriş təqdim olunmayıb.</p>
        <p className="mt-1.5 text-sm text-ink-faint">Giriş üçün administratora müraciət edin.</p>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold" style={{ color: EM2, borderColor: EM + '55' }}>
          <ShieldCheck size={14} /> Qorunan bölmə
        </div>
      </div>
    </div>
  );
}

function Preload() {
  return (
    <div className="fin-app flex-1 grid place-items-center min-h-[70vh]">
      <Style />
      <div className="text-center">
        <div className="fin-orb mx-auto mb-7 grid size-20 place-items-center rounded-3xl text-white" style={{ background: `linear-gradient(135deg, ${EM}, ${BLUE})` }}>
          <Wallet size={40} />
        </div>
        <h1 className="fin-grad text-5xl font-black tracking-[0.18em] pl-[0.18em]">FINANCE</h1>
        <p className="mt-4 text-[11px] tracking-[0.4em] text-ink-faint uppercase pl-[0.4em]">Appina Management</p>
        <p className="mt-10 text-[11px] tracking-[0.25em] text-ink-faint uppercase pl-[0.25em]">
          Appina Finance — Developed by <a href="https://www.linkedin.com/in/elinzrv/" target="_blank" rel="noopener noreferrer" className="fin-grad font-semibold">Elməddin Nəzərli</a>
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const v = (value || '').toLowerCase();
  const ok = ['ödənilib', 'tamamlanıb'].includes(v);
  const pend = ['davam edir', 'sənədlər göndərilib'].includes(v);
  const style = ok ? { color: EM2, background: EM + '1a' } : pend ? { color: '#f59e0b', background: '#f59e0b1a' } : { color: '#b91c1c', background: '#ef44441a' };
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={style}>{ok && <CheckCircle2 size={11} />}{value || '—'}</span>;
}

function StatusSelect({ value, opts, onChange }) {
  const v = (value || '').toLowerCase();
  const ok = ['ödənilib', 'tamamlanıb'].includes(v);
  const pend = ['davam edir', 'sənödlər göndərilib', 'sənədlər göndərilib'].includes(v);
  const color = ok ? EM2 : pend ? '#f59e0b' : '#b91c1c';
  return (
    <select className="fin-statussel" style={{ color, background: color + '14', borderColor: color + '55' }}
      value={value || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => onChange(e.target.value)}>
      {!opts.includes(value) && value && <option value={value}>{value}</option>}
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Table({ columns, rows, onEdit, onDelete, statusOpts, onStatus, filters, onFilter, sortable, sort, onSort, fields, onCellSave }) {
  const acts = !!(onEdit || onDelete);
  const isSortable = (k) => !!(sortable && sortable.includes(k) && onSort);
  const fieldOf = (k) => (fields || []).find((f) => f.key === k);
  const editableKey = (k) => !!onCellSave && !!fieldOf(k) && k !== 'status';
  const [cell, setCell] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { if (cell && inputRef.current) { inputRef.current.focus(); if (typeof inputRef.current.select === 'function') inputRef.current.select(); } }, [cell?.id, cell?.key]);
  const startEdit = (row, key) => { if (!editableKey(key)) return; const f = fieldOf(key); setCell({ id: row.id, key, value: row[key] ?? '', type: f?.type, opts: f?.opts }); };
  const cancel = () => setCell(null);
  const commit = async () => {
    if (!cell) return;
    const row = rows.find((r) => r.id === cell.id);
    if (!row) { setCell(null); return; }
    const prev = row[cell.key] ?? '';
    if (String(prev) === String(cell.value ?? '')) { setCell(null); return; }
    try { await onCellSave(row, cell.key, cell.value); } finally { setCell(null); }
  };
  const onCellKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
  return (
    <div className="fin-card fin-rise overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-ink-faint">
            {columns.map((c) => {
              const active = sort && sort.key === c.key;
              const arrow = active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';
              return isSortable(c.key)
                ? <th key={c.key} className={`px-2.5 py-2 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}><button type="button" onClick={() => onSort(c.key)} className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink select-none ${active ? 'text-emerald-600' : ''}`} title="Sıralamaq üçün klikləyin">{c.label}{arrow}</button></th>
                : <th key={c.key} className={`px-2.5 py-2 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>;
            })}
            {acts && <th className="px-2 py-2" />}
          </tr>
          {filters && onFilter && (
            <tr className="border-b border-line bg-elevated/30">
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-1.5 font-normal normal-case tracking-normal">
                  {c.key === 'status' && statusOpts ? (
                    <select value={filters[c.key] || ''} onChange={(e) => onFilter(c.key, e.target.value)}
                      className="w-full rounded-md border border-line bg-bg px-2 py-1 text-[11px] text-ink outline-none focus:border-emerald-500">
                      <option value="">Hamısı</option>
                      {statusOpts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={filters[c.key] || ''} onChange={(e) => onFilter(c.key, e.target.value)}
                      placeholder="Filter..." className={`w-full rounded-md border border-line bg-bg px-2 py-1 text-[11px] text-ink outline-none focus:border-emerald-500 ${c.align === 'right' ? 'text-right' : ''}`} />
                  )}
                </th>
              ))}
              {acts && <th className="px-2 py-1.5" />}
            </tr>
          )}
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length + (acts ? 1 : 0)} className="px-4 py-10 text-center text-ink-faint">Məlumat yoxdur</td></tr>}
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="group border-b border-line/60 hover:bg-elevated/50">
              {columns.map((c) => {
                const isEditing = cell && cell.id === row.id && cell.key === c.key;
                const canEditCell = editableKey(c.key);
                if (isEditing) {
                  const common = { ref: inputRef, value: cell.value ?? '', onChange: (e) => setCell((p) => ({ ...p, value: e.target.value })), onBlur: commit, onKeyDown: onCellKey, className: `w-full rounded-md border border-emerald-500 bg-bg px-2 py-1 text-[12px] text-ink outline-none ${c.align === 'right' ? 'text-right' : ''}` };
                  return (
                    <td key={c.key} className={`px-2 py-1 ${c.align === 'right' ? 'text-right' : ''}`}>
                      {cell.type === 'select' && Array.isArray(cell.opts) ? (
                        <select {...common}><option value="">—</option>{cell.opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                      ) : cell.type === 'date' ? (
                        <input type="date" {...common} />
                      ) : cell.type === 'number' ? (
                        <input type="number" step="any" {...common} />
                      ) : (
                        <input type="text" {...common} />
                      )}
                    </td>
                  );
                }
                return (
                  <td key={c.key} className={`px-2.5 py-2 ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.strong ? 'font-semibold' : ''} ${canEditCell ? 'cursor-pointer hover:bg-emerald-500/5' : ''}`} onClick={canEditCell ? () => startEdit(row, c.key) : undefined} title={canEditCell ? 'Dəyişmək üçün klikləyin' : undefined}>
                    {c.key === 'status' && statusOpts && onStatus
                      ? <StatusSelect value={row.status} opts={statusOpts} onChange={(s) => onStatus(row, s)} />
                      : c.cell ? c.cell(row) : (row[c.key] ?? '—')}
                  </td>
                );
              })}
              {acts && (
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {onEdit && <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-elevated text-ink-faint hover:text-emerald-600" title="Redaktə"><Pencil size={14} /></button>}
                    {onDelete && <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-elevated text-ink-faint hover:text-red-500" title="Sil"><Trash2 size={14} /></button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_OPTS = {
  capex: ['davam edir', 'tamamlanıb', 'dayandırılıb'],
  licenses: ['ödənilib', 'sənədlər göndərilib', 'boş'],
  equipment: ['borcludur', 'ödənilib'],
};
const FIELDS = {
  capex: [
    { key: 'customer_name', label: 'Müştəri' }, { key: 'project_name', label: 'Layihə' },
    { key: 'total_amount', label: 'Ümumi məbləğ', type: 'number' }, { key: 'advance_percentage', label: 'Avans %', type: 'number' },
    { key: 'advance_payment_date', label: 'Avans tarixi', type: 'date' },
    { key: 'remaining_amount_1', label: 'Qalıq ödəniş 1', type: 'number' }, { key: 'remaining_payment_date_1', label: 'Qalıq 1 tarixi', type: 'date' },
    { key: 'remaining_amount_2', label: 'Qalıq ödəniş 2', type: 'number' }, { key: 'remaining_payment_date_2', label: 'Qalıq 2 tarixi', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', opts: STATUS_OPTS.capex },
    { key: 'notes', label: 'Qeyd' },
  ],
  licenses: [
    { key: 'customer_name', label: 'Müştəri' }, { key: 'month', label: 'Ay' }, { key: 'amount', label: 'Məbləğ', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', opts: STATUS_OPTS.licenses }, { key: 'notes', label: 'Qeyd' },
  ],
  equipment: [
    { key: 'customer_name', label: 'Müştəri' }, { key: 'date', label: 'Tarix' }, { key: 'amount', label: 'Məbləğ', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', opts: STATUS_OPTS.equipment }, { key: 'description', label: 'Təsvir' },
  ],
  contracts: [
    { key: 'contract_no', label: '№' }, { key: 'customer', label: 'Müştəri' }, { key: 'validity', label: 'Etibarlılıq' },
    { key: 'classification', label: 'Təsnifat' }, { key: 'link', label: 'Sənəd linki' },
  ],
  numbers: [
    { key: 'date_range', label: 'Tarix' }, { key: 'gsm_number', label: 'Nömrə' }, { key: 'employee_name', label: 'Əməkdaş' },
    { key: 'total_amount', label: 'Məbləğ', type: 'number' }, { key: 'tariff_plan', label: 'Tarif' },
  ],
  yango: [
    { key: 'date', label: 'Tarix' }, { key: 'user', label: 'İstifadəçi' },
    { key: 'pickup', label: 'Haradan' }, { key: 'destination', label: 'Hara' }, { key: 'fare', label: 'Qiymət', type: 'number' },
    { key: 'trip_type', label: 'Növ' }, { key: 'purpose', label: 'Məqsəd' },
  ],
  nagd: [
    { key: 'date', label: 'Tarix' }, { key: 'amount', label: 'Məbləğ', type: 'number' },
    { key: 'description', label: 'Təsvir' }, { key: 'category', label: 'Kateqoriya' }, { key: 'source', label: 'Mənbə' },
  ],
};

const COLUMNS = {
  capex: [
    { key: 'customer_name', label: 'Müştəri', strong: true }, { key: 'project_name', label: 'Layihə' },
    { key: 'total_amount', label: 'Ümumi məbləğ', align: 'right', cell: (r) => money(r.total_amount) },
    { key: 'advance_percentage', label: 'Avans %', align: 'right', cell: (r) => (r.advance_percentage == null || r.advance_percentage === '') ? '—' : `${r.advance_percentage}%` },
    { key: 'advance_amount', label: 'Avans ödənişi', align: 'right', cell: (r) => (r.advance_amount == null || r.advance_amount === '') ? '—' : money(r.advance_amount) },
    { key: 'advance_payment_date', label: 'Avans tarixi', cell: (r) => r.advance_payment_date || '—' },
    { key: 'remaining_amount_1', label: 'Qalıq ödəniş 1', align: 'right', cell: (r) => (r.remaining_amount_1 == null || r.remaining_amount_1 === '') ? '—' : money(r.remaining_amount_1) },
    { key: 'remaining_payment_date_1', label: 'Tarix 1', cell: (r) => r.remaining_payment_date_1 || '—' },
    { key: 'remaining_amount_2', label: 'Qalıq ödəniş 2', align: 'right', cell: (r) => (r.remaining_amount_2 == null || r.remaining_amount_2 === '') ? '—' : money(r.remaining_amount_2) },
    { key: 'remaining_payment_date_2', label: 'Tarix 2', cell: (r) => r.remaining_payment_date_2 || '—' },
    { key: 'remaining_debt', label: 'Qalıq borc', align: 'right', cell: (r) => { const v = Math.round((Number(r.total_amount || 0) - Number(r.advance_amount || 0) - Number(r.remaining_amount_1 || 0) - Number(r.remaining_amount_2 || 0)) * 100) / 100; return <span style={{ color: v > 0 ? '#f59e0b' : 'var(--ink-faint)', fontWeight: 700 }}>{money(v)}</span>; } },
    { key: 'status', label: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
  ],
  licenses: [
    { key: 'customer_name', label: 'Müştəri', strong: true }, { key: 'month', label: 'Ay' },
    { key: 'amount', label: 'Məbləğ', align: 'right', cell: (r) => money(r.amount) },
    { key: 'status', label: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'notes', label: 'Qeyd', cell: (r) => <span className="text-ink-muted">{r.notes || '—'}</span> },
  ],
  equipment: [
    { key: 'customer_name', label: 'Müştəri', strong: true }, { key: 'date', label: 'Tarix' },
    { key: 'amount', label: 'Məbləğ', align: 'right', cell: (r) => money(r.amount) },
    { key: 'status', label: 'Status', cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'description', label: 'Təsvir', cell: (r) => <span className="text-ink-muted">{r.description || '—'}</span> },
  ],
  contracts: [
    { key: 'contract_no', label: '№', strong: true }, { key: 'customer', label: 'Müştəri' }, { key: 'validity', label: 'Etibarlılıq' },
    { key: 'classification', label: 'Təsnifat' },
    { key: 'link', label: 'Sənəd', cell: (r) => r.link ? <a href={r.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1" style={{ color: EM2 }}>Aç <ExternalLink size={12} /></a> : '—' },
  ],
  numbers: [
    { key: 'date_range', label: 'Tarix' },
    { key: 'gsm_number', label: 'Nömrə', strong: true, cell: (r) => r.gsm_number ? <PhoneActions phone={r.gsm_number} /> : '—' },
    { key: 'employee_name', label: 'Əməkdaş' },
    { key: 'total_amount', label: 'Məbləğ', align: 'right', cell: (r) => money(r.total_amount) }, { key: 'tariff_plan', label: 'Tarif' },
  ],
  yango: [
    { key: 'date', label: 'Tarix' }, { key: 'user', label: 'İstifadəçi', strong: true },
    { key: 'pickup', label: 'Haradan', cell: (r) => <span className="text-ink-muted">{r.pickup || '—'}</span> },
    { key: 'destination', label: 'Hara', cell: (r) => <span className="text-ink-muted">{r.destination || '—'}</span> },
    { key: 'fare', label: 'Qiymət', align: 'right', cell: (r) => money(r.fare) }, { key: 'purpose', label: 'Məqsəd' },
  ],
  nagd: [
    { key: 'id', label: '#', cell: (r) => <span className="text-ink-faint">#{r.id}</span> },
    { key: 'date', label: 'Tarix', strong: true }, { key: 'description', label: 'Səbəb', cell: (r) => <span className="text-ink-muted">{r.description || '—'}</span> },
    { key: 'category', label: 'Kateqoriya' },
    { key: 'amount', label: 'Məbləğ', align: 'right', cell: (r) => <span style={{ color: EM2, fontWeight: 700 }}>{money(r.amount)}</span> },
    { key: 'source', label: 'Mənbə', cell: (r) => <span className="text-ink-faint">{r.source || '—'}</span> },
  ],
};

const SECTIONS = [
  { key: 'panel', label: 'Panel', icon: LayoutDashboard },
  { key: 'capex', label: 'CAPEX', icon: Layers, endpoint: '/finance/capex' },
  { key: 'licenses', label: 'Lisenziyalar', icon: BadgeDollarSign, endpoint: '/finance/licenses' },
  { key: 'equipment', label: 'Avadanlıq satışı', icon: Wrench, endpoint: '/finance/equipment' },
  { key: 'contracts', label: 'Müqavilələr', icon: FileText, endpoint: '/finance/contracts' },
  { key: 'numbers', label: 'Korp. nömrələr', icon: Phone, endpoint: '/finance/numbers' },
  { key: 'yango', label: 'Yango', icon: Car, endpoint: '/finance/yango' },
  { key: 'omid', label: 'Omid alışları', icon: ShoppingCart, endpoint: '/finance/omid' },
  { key: 'nagd', label: 'Nağd xərclər', icon: Banknote, endpoint: '/finance/nagd' },
  { key: 'ai', label: 'AI Köməkçi', icon: Sparkles },
];

function Kpi({ icon: Icon, label, value, accent }) {
  return (
    <div className="fin-card hov fin-rise relative overflow-hidden p-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint"><Icon size={15} color={accent} /> {label}</div>
      <div className="mt-2.5 text-[26px] font-black leading-tight" style={{ color: accent }}>{value}</div>
      <Icon size={86} color={accent} className="pointer-events-none absolute -right-3 -bottom-4 opacity-[0.07]" />
    </div>
  );
}

function DebtorList({ title, rows }) {
  const max = Math.max(1, ...rows.map((d) => d.debt));
  return (
    <div className="fin-card fin-rise p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><TrendingDown size={16} color={EM2} /> {title}</h3>
      <div className="space-y-2.5">
        {rows.length === 0 && <div className="text-sm text-ink-faint">Borc yoxdur</div>}
        {rows.map((d, i) => (
          <div key={d.customer_name} className="flex items-center gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold" style={{ color: i === 0 ? EM2 : 'var(--ink-faint)', border: `1px solid ${i === 0 ? EM + '66' : 'var(--line)'}` }}>{i + 1}</span>
            <span className="w-36 shrink-0 truncate text-sm font-semibold">{d.customer_name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full" style={{ width: `${(d.debt / max) * 100}%`, background: `linear-gradient(90deg, ${EM}, ${BLUE})` }} /></div>
            <span className="w-28 shrink-0 text-right text-sm font-bold" style={{ color: EM2 }}>{money(d.debt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Area trend with gradient fill + previous-period % diff in the tooltip (faithful to finance-app).
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const prev = payload[0]?.payload?.prevValue;
  const diff = prev != null && prev !== 0 ? ((payload[0].value - prev) / prev) * 100 : null;
  return (
    <div className="rounded-lg border border-line bg-surface/95 backdrop-blur px-3.5 py-2.5 text-sm shadow-float">
      <p className="font-medium mb-0.5">{label}</p>
      <p className="font-mono text-[15px] font-bold">{money(payload[0].value)}</p>
      {diff != null && <p className={diff >= 0 ? 'text-red-500' : 'text-emerald-500'}>{diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)}% əvvəlki dövrə nisbətən</p>}
    </div>
  );
}
function TrendChart({ title, data = [], color = '#3b82f6', icon: Icon }) {
  const cd = (data || []).map((d, i, a) => ({ label: d.label ?? d.month, value: d.value, prevValue: i > 0 ? a[i - 1].value : undefined }));
  const gid = `trendGrad-${(color || '').replace('#', '')}-${title.length}`;
  return (
    <div className="fin-card fin-rise p-5 h-full">
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">{Icon && <Icon size={16} color={color} />} {title}</h3>
      {cd.length === 0 ? <div className="grid h-[260px] place-items-center text-sm text-ink-faint">Məlumat yoxdur</div> : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cd} margin={{ top: 6, right: 6, left: -18, bottom: 4 }}>
            <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-2)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v)}`} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gid})`} dot={{ r: 3.5, fill: color, stroke: 'var(--surface)', strokeWidth: 2 }} activeDot={{ r: 6, fill: color, stroke: 'var(--surface)', strokeWidth: 2 }} animationDuration={1100} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Monthly expense bar (Omid expenses grouped by month) — faithful to finance-app.
function MonthlyExpenseChart({ expenses }) {
  const data = (() => {
    const by = {};
    for (const e of expenses || []) {
      const p = String(e.date || '').split('.');
      if (p.length === 3) { const m = `${p[1]}.${p[2]}`; by[m] = (by[m] || 0) + (e.amount || 0); }
    }
    return Object.entries(by).sort(([a], [b]) => { const [mA, yA] = a.split('.').map(Number); const [mB, yB] = b.split('.').map(Number); return yA - yB || mA - mB; }).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  })();
  if (!expenses || expenses.length === 0) return <div className="fin-card p-6 min-h-[200px] grid place-items-center text-sm text-ink-faint">Məlumat yoxdur</div>;
  return (
    <div className="fin-card fin-rise p-5">
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">Aylar üzrə xərclər</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -18, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'var(--elevated)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12, color: 'var(--text)' }} labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} formatter={(v) => money(v)} />
          <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={1100} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Interactive Omid balance ledger (income/expense lists + income CRUD) — faithful to finance-app.
function OmidBalance({ onDataChange }) {
  const me = useAuth((s) => s.user);
  const canEdit = !!me && (isFullAccess(me.role) || me.finance_access);
  const [data, setData] = useState(null);
  const [dlg, setDlg] = useState(null);   // { date, amount } — ADD dialog only
  const [edit, setEdit] = useState(null); // { id, date, amount } — inline edit row
  const [del, setDel] = useState(null);   // income id to delete
  const load = () => api.get('/finance/omid-balance').then((d) => { setData(d); onDataChange?.(d.expenses || []); }).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line
  const addIncome = async () => {
    if (!dlg?.date || dlg.amount === '' || dlg.amount == null) return;
    try { await api.post('/finance/omid-income', { date: fromISO(dlg.date), amount: Number(dlg.amount) }); setDlg(null); load(); } catch { /* */ }
  };
  const saveEdit = async () => {
    if (!edit?.date || edit.amount === '' || edit.amount == null) return;
    try { await api.put(`/finance/omid-income/${edit.id}`, { date: fromISO(edit.date), amount: Number(edit.amount) }); setEdit(null); load(); } catch { /* */ }
  };
  const remove = async () => { try { await api.del(`/finance/omid-income/${del}`); setDel(null); load(); } catch { /* */ } };

  const ti = data?.total_income ?? 0, te = data?.total_expense ?? 0, bal = data?.balance ?? 0;
  return (
    <div className="fin-card fin-rise overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line flex items-center justify-between">
        <h3 className="font-bold text-[15px] flex items-center gap-2"><ShoppingCart size={16} color={EM2} /> Omid balansı</h3>
        {canEdit && (
          <button onClick={() => setDlg({ date: '', amount: '' })} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}><Plus size={14} /> Mədaxil</button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line">
        <div className="p-5 flex flex-col">
          <h4 className="text-[13px] font-bold mb-2.5 flex items-center gap-2" style={{ color: EM2 }}><span className="size-2 rounded-full" style={{ background: EM2 }} /> Mədaxil</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {(data?.incomes || []).length === 0 && <p className="text-xs text-ink-faint">Mədaxil yoxdur</p>}
            {(data?.incomes || []).map((inc) => (
              edit?.id === inc.id ? (
                <div key={inc.id} className="flex items-center gap-1.5 py-1 px-1">
                  <input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} className="flex-1 min-w-0 rounded border border-line bg-bg px-1.5 py-1 text-[12px]" />
                  <input type="number" step="0.01" value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} className="w-20 rounded border border-line bg-bg px-1.5 py-1 text-[12px] text-right" onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEdit(null); }} autoFocus />
                  <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-elevated rounded"><Check size={13} /></button>
                  <button onClick={() => setEdit(null)} className="p-1 text-ink-faint hover:bg-elevated rounded"><X size={13} /></button>
                </div>
              ) : (
                <div key={inc.id} className="group relative flex items-center justify-between gap-2 text-sm py-1 px-2 rounded hover:bg-elevated/50">
                  <span className="text-ink-faint">{inc.date}</span>
                  <span className="font-mono font-medium tabular-nums" style={{ color: EM2 }}>{money(inc.amount)}</span>
                  {canEdit && (
                    <span className="opacity-0 group-hover:opacity-100 flex gap-1 absolute right-2 top-1/2 -translate-y-1/2 bg-elevated rounded px-1">
                      <button onClick={() => setEdit({ id: inc.id, date: toISO(inc.date), amount: String(inc.amount) })} className="p-0.5 text-ink-faint hover:text-emerald-600"><Pencil size={12} /></button>
                      <button onClick={() => setDel(inc.id)} className="p-0.5 text-ink-faint hover:text-red-500"><Trash2 size={12} /></button>
                    </span>
                  )}
                </div>
              )
            ))}
          </div>
          <div className="flex items-center justify-between text-sm font-bold border-t border-line mt-auto pt-2"><span>Cəm Mədaxil:</span><span className="font-mono" style={{ color: EM2 }}>{money(ti)}</span></div>
        </div>
        <div className="p-5 flex flex-col">
          <h4 className="text-[13px] font-bold mb-2.5 flex items-center gap-2 text-red-500"><span className="size-2 rounded-full bg-red-500" /> Xərclər</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {(data?.expenses || []).length === 0 && <p className="text-xs text-ink-faint">Xərc yoxdur</p>}
            {(data?.expenses || []).map((exp) => (
              <div key={exp.id} className="flex items-center justify-between gap-2 text-sm py-1 px-2 rounded hover:bg-elevated/50">
                <span className="text-ink-faint">{exp.date}</span>
                <span className="font-mono font-medium tabular-nums" style={{ color: '#ef4444' }}>{money(exp.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm font-bold border-t border-line mt-auto pt-2"><span>Cəm Xərc:</span><span className="font-mono text-red-500">{money(te)}</span></div>
        </div>
      </div>
      <div className="border-t border-line bg-elevated/30 px-5 py-3 flex items-center justify-between text-sm font-bold">
        <span>Qalıq:</span>
        <span className="font-mono text-lg" style={{ color: bal >= 0 ? EM2 : '#ef4444' }}>{money(bal)}</span>
      </div>

      {dlg && (
        <div className="fixed inset-0 z-[70] bg-black/50 grid place-items-center p-4" onClick={() => setDlg(null)}>
          <div className="bg-surface border border-line rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Mədaxil əlavə et</h3>
            <label className="block text-[12px] text-ink-faint mb-1">Tarix</label>
            <input type="date" value={dlg.date} onChange={(e) => setDlg({ ...dlg, date: e.target.value })} className="w-full mb-3 rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <label className="block text-[12px] text-ink-faint mb-1">Məbləğ (₼)</label>
            <input type="number" step="0.01" value={dlg.amount} onChange={(e) => setDlg({ ...dlg, amount: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addIncome()} className="w-full mb-4 rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setDlg(null)} className="px-3 py-1.5 text-sm rounded-lg border border-line">Ləğv</button>
              <button onClick={addIncome} className="px-3.5 py-1.5 text-sm font-bold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>Əlavə et</button>
            </div>
          </div>
        </div>
      )}
      {del != null && (
        <div className="fixed inset-0 z-[70] bg-black/50 grid place-items-center p-4" onClick={() => setDel(null)}>
          <div className="bg-surface border border-line rounded-2xl w-full max-w-sm p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm mb-4">Bu mədaxil qeydini silmək istəyirsiniz?</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setDel(null)} className="px-3 py-1.5 text-sm rounded-lg border border-line">Ləğv</button>
              <button onClick={remove} className="px-3.5 py-1.5 text-sm font-bold text-white rounded-lg bg-[#dc2626]">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#9ca3af'];
function StatusDonut({ title, data, footer }) {
  const total = (data || []).reduce((s, d) => s + (d.value || 0), 0);
  return (
    <div className="fin-card fin-rise p-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><BadgeDollarSign size={16} color={EM2} /> {title}</h3>
      {total === 0 ? <div className="grid h-[260px] place-items-center text-sm text-ink-faint">Məlumat yoxdur</div> : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
              {data.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12, color: 'var(--text)' }} labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} formatter={(v) => money(v)} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-2)' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
      {footer}
    </div>
  );
}

function OverviewBar({ title, data }) {
  return (
    <div className="fin-card fin-rise p-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><Wrench size={16} color={EM2} /> {title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
          <Tooltip cursor={{ fill: 'var(--elevated)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12, color: 'var(--text)' }} labelStyle={{ color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} formatter={(v) => money(v)} />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={24}>
            {(data || []).map((e, i) => <Cell key={i} fill={i === 0 ? '#dc2626' : EM} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DualTrend({ title, data }) {
  return (
    <div className="fin-card fin-rise p-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><BadgeDollarSign size={16} color={EM2} /> {title}</h3>
      {(!data || data.length === 0) ? <div className="grid h-[260px] place-items-center text-sm text-ink-faint">Məlumat yoxdur</div> : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 12, color: 'var(--text)' }} formatter={(v) => money(v)} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-2)' }} />
            <Line type="monotone" dataKey="revenue" name="Gəlir" stroke={EM} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="payments" name="Ödənişlər" stroke={BLUE} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}


function Panel({ dash }) {
  const [omidExpenses, setOmidExpenses] = useState([]);
  if (!dash) return <div className="grid place-items-center py-20 text-ink-faint">Yüklənir…</div>;
  return (
    <div className="space-y-6">
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Ümumi CAPEX" value={money(dash.total_capex)} accent={EM2} />
        <Kpi icon={TrendingDown} label="CAPEX Qalıq Məbləğ" value={money(dash.remaining_amount)} accent={BLUE} />
        <Kpi icon={BadgeDollarSign} label="Lisenziya borcu" value={money(dash.license_unpaid_total)} accent="#f59e0b" />
        <Kpi icon={Wrench} label="Avadanlıq borcu" value={money(dash.equipment_debt_total)} accent="#dc2626" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DebtorList title="CAPEX — Ən çox borclu 5 müştəri" rows={dash.top_debtors || []} />
        <DebtorList title="Lisenziya — Ən çox borclu 5 müştəri" rows={dash.license_top_debtors || []} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="fin-card fin-rise p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><Wrench size={16} color="#dc2626" /> Avadanlıq və Xidmət borcları</h3>
          <div className="space-y-2">
            {(dash.equipment_debts || []).length === 0 && <div className="text-sm text-ink-faint">Borclu müştəri yoxdur</div>}
            {(dash.equipment_debts || []).map((d) => (
              <div key={d.customer_name} className="flex items-center justify-between border-b border-line/50 pb-1.5 text-sm">
                <span className="font-semibold">{d.customer_name}</span>
                <span className="font-bold" style={{ color: '#dc2626' }}>{money(d.debt)}</span>
              </div>
            ))}
          </div>
        </div>
        <OverviewBar title="Avadanlıq və Xidmət satışı" data={dash.equipment_overview || []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OmidBalance onDataChange={setOmidExpenses} />
        <MonthlyExpenseChart expenses={omidExpenses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart title="Yango xərc trendi" data={dash.yango_trend} color="#f59e0b" icon={Car} />
        <TrendChart title="Şirkət nömrələri xərclərini izləmə qrafiki" data={dash.numbers_trend} color="#8b5cf6" icon={Phone} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart title="Omid xərc izləmə qrafiki" data={dash.omid_trend} color="#14b8a6" icon={ShoppingCart} />
        <StatusDonut title="Lisenziya — status və məbləğ" data={dash.lic_status || []}
          footer={(
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-center">
              <div><div className="text-[11px] uppercase tracking-wider text-ink-faint">Ödənilmiş</div><div className="mt-1 text-xl font-black" style={{ color: EM2 }}>{money(dash.license_paid_total)}</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-ink-faint">Borc</div><div className="mt-1 text-xl font-black" style={{ color: '#f59e0b' }}>{money(dash.license_unpaid_total)}</div></div>
            </div>
          )} />
      </div>

      <DualTrend title="Aylıq gəlir trendi" data={dash.monthly_trend} />

      <TrendChart title="Nağd xərc trendi" data={dash.nagd_trend} color="#10b981" icon={Banknote} />

    </div>
  );
}

function OmidView({ rows, canEdit, onEdit, onDelete }) {
  if (!rows.length) return <div className="fin-card px-4 py-10 text-center text-ink-faint">Məlumat yoxdur</div>;
  return (
    <div className="space-y-3">
      {rows.map((o) => (
        <div key={o.id} className="fin-card fin-rise overflow-hidden group">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line px-4 py-3">
            <span className="text-sm font-bold">{o.date}</span>
            <span className="text-sm" style={{ color: EM2 }}>ƏDV ilə: <b>{money(o.total_with_vat)}</b></span>
            <span className="ml-auto text-xs text-ink-faint">{(o.items || []).length} məhsul</span>
            {canEdit && (
              <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => onEdit(o)} className="p-1.5 rounded-lg hover:bg-elevated text-ink-faint hover:text-emerald-600" title="Redaktə"><Pencil size={14} /></button>
                <button onClick={() => onDelete(o)} className="p-1.5 rounded-lg hover:bg-elevated text-ink-faint hover:text-red-500" title="Sil"><Trash2 size={14} /></button>
              </span>
            )}
          </div>
          {(o.items || []).length > 0 && (
            <table className="w-full text-[13px]">
              <thead><tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint"><th className="px-4 py-1.5">Məhsul</th><th className="px-4 py-1.5 text-right">Say</th><th className="px-4 py-1.5 text-right">Qiymət</th><th className="px-4 py-1.5 text-right">Məbləğ</th></tr></thead>
              <tbody>{o.items.map((it) => (
                <tr key={it.id} className="border-t border-line/50"><td className="px-4 py-1.5">{it.product_name}</td><td className="px-4 py-1.5 text-right tabular-nums">{it.quantity} {it.unit || ''}</td><td className="px-4 py-1.5 text-right tabular-nums">{money(it.unit_price)}</td><td className="px-4 py-1.5 text-right tabular-nums font-semibold">{money(it.amount_with_vat || it.amount)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

// Dynamic purchase form (date + line items) — faithful to finance-app OmidAlisTable.
const OMID_VAT = 18;
const r4 = (x) => Math.round((Number(x) || 0) * 10000) / 10000;
const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const blankOmidItem = () => ({ product_name: '', quantity: '', unit: 'əd', unit_price: '', vat_rate: OMID_VAT });
const calcOmidRow = (it) => {
  const amount = r4((Number(it.quantity) || 0) * (Number(it.unit_price) || 0));
  const vat = it.vat_rate == null || it.vat_rate === '' ? OMID_VAT : Number(it.vat_rate) || 0;
  return { amount, amount_with_vat: r2(amount * (1 + vat / 100)) };
};

function OmidAlisForm({ row, onClose, onSave, saving }) {
  const [date, setDate] = useState(() => toISO(row?.date) || '');
  const [items, setItems] = useState(() =>
    row?.items?.length
      ? row.items.map((it) => ({ product_name: it.product_name || '', quantity: String(it.quantity ?? ''), unit: it.unit || 'əd', unit_price: String(it.unit_price ?? ''), vat_rate: OMID_VAT }))
      : [blankOmidItem()],
  );
  const setItem = (idx, k, v) => setItems((p) => p.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  const addRow = () => setItems((p) => [...p, blankOmidItem()]);
  const removeRow = (idx) => setItems((p) => (p.length > 1 ? p.filter((_, i) => i !== idx) : p));
  const grandTotal = items.reduce((s, it) => s + calcOmidRow(it).amount_with_vat, 0);

  const submit = () => {
    if (!date) { window.alert('Tarix daxil edin'); return; }
    const valid = items.filter((it) => it.product_name.trim());
    if (!valid.length) { window.alert('Ən azı bir məhsul daxil edin'); return; }
    onSave({
      date: fromISO(date),
      items: valid.map((it) => ({
        product_name: it.product_name.trim(),
        quantity: Number(it.quantity) || 0,
        unit: it.unit || 'əd',
        unit_price: Number(it.unit_price) || 0,
        vat_rate: it.vat_rate == null || it.vat_rate === '' ? OMID_VAT : Number(it.vat_rate) || 0,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 grid place-items-center p-4" onClick={onClose}>
      <div className="fin-card fin-rise w-full max-w-[94vw] sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 shrink-0">
          <h3 className="flex items-center gap-2 font-bold min-w-0"><ShoppingCart size={16} color={EM2} /><span className="truncate">{row ? 'Alışı redaktə et' : 'Yeni alış'}</span></h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink shrink-0"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <label className="text-sm block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Alış tarixi</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-52 rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-emerald-500" />
          </label>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-elevated/40 text-left text-[10px] uppercase tracking-wider text-ink-faint">
                  <th className="px-2 py-2 w-9 text-center">№</th>
                  <th className="px-2 py-2">Məhsulun adı</th>
                  <th className="px-2 py-2 w-20 text-right">Say</th>
                  <th className="px-2 py-2 w-16 text-center">Vahid</th>
                  <th className="px-2 py-2 w-28 text-right">Qiymət</th>
                  <th className="px-2 py-2 w-16 text-right">ƏDV %</th>
                  <th className="px-2 py-2 w-24 text-right">Məbləğ</th>
                  <th className="px-2 py-2 w-28 text-right">ƏDV ilə</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const c = calcOmidRow(it);
                  return (
                    <tr key={idx} className="border-b border-line/60 last:border-b-0">
                      <td className="px-2 py-1.5 text-center text-ink-faint">{idx + 1}</td>
                      <td className="px-2 py-1.5"><input value={it.product_name} onChange={(e) => setItem(idx, 'product_name', e.target.value)} placeholder="Məhsulun adı" className="w-full min-w-[140px] rounded border border-line bg-bg px-2 py-1.5 outline-none focus:border-emerald-500" /></td>
                      <td className="px-2 py-1.5"><input type="number" step="any" value={it.quantity} onChange={(e) => setItem(idx, 'quantity', e.target.value)} className="w-full rounded border border-line bg-bg px-2 py-1.5 text-right tabular-nums outline-none focus:border-emerald-500" /></td>
                      <td className="px-2 py-1.5"><input value={it.unit} onChange={(e) => setItem(idx, 'unit', e.target.value)} className="w-full rounded border border-line bg-bg px-2 py-1.5 text-center outline-none focus:border-emerald-500" /></td>
                      <td className="px-2 py-1.5"><input type="number" step="any" value={it.unit_price} onChange={(e) => setItem(idx, 'unit_price', e.target.value)} className="w-full rounded border border-line bg-bg px-2 py-1.5 text-right tabular-nums outline-none focus:border-emerald-500" /></td>
                      <td className="px-2 py-1.5"><input type="number" step="any" value={it.vat_rate} onChange={(e) => setItem(idx, 'vat_rate', e.target.value)} className="w-full rounded border border-line bg-bg px-2 py-1.5 text-right tabular-nums outline-none focus:border-emerald-500" /></td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-ink-muted">{c.amount.toFixed(4)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{c.amount_with_vat.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-center"><button onClick={() => removeRow(idx)} disabled={items.length === 1} className="p-1 rounded text-ink-faint hover:text-red-500 disabled:opacity-30" title="Sil"><Trash2 size={13} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={addRow} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-muted hover:text-ink hover:border-emerald-500"><Plus size={14} /> Sətir əlavə et</button>
            <div className="text-sm font-bold">Ümumi (ƏDV ilə): <span className="font-mono" style={{ color: EM2 }}>{money(r2(grandTotal))}</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5 shrink-0">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-elevated">Ləğv</button>
          <button onClick={submit} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>{saving ? '...' : 'Yadda saxla'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Finance terminal AI — live "Fable 5 (Mythos)" (Claude), hard-scoped to Finance ──
async function streamFinanceAI({ message, threadId, mode = 'fast', attachments, signal, onMeta, onModel, onDelta, onAction, onError, onDone }) {
  let res;
  try {
    res = await fetch(BASE + '/ai/chat', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, threadId: threadId ?? undefined, mode, context: 'finance', attachments: attachments?.length ? attachments : undefined }), signal });
  } catch (e) { if (e?.name !== 'AbortError') onError(e?.message); return; }
  if (!res.ok || !res.body) { let m = res.statusText || 'request_failed'; try { const d = await res.json(); m = d?.error || d?.message || m; } catch { /* */ } onError(m); return; }
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '', event = 'message';
  const handle = (ev, p) => {
    if (!p) return; let o; try { o = JSON.parse(p); } catch { return; }
    if (ev === 'meta') { if (o?.threadId != null) onMeta(o.threadId); }
    else if (ev === 'model') onModel?.(o);
    else if (ev === 'action') onAction?.(o);
    else if (ev === 'phase') onAction?.({ op: o.phase, module: o.file || (o.files || o.blocked || []).join?.(', ') || (o.count ? `${o.count} fayl` : ''), ok: o.phase !== 'reverted' && o.phase !== 'blocked' });
    else if (ev === 'error') onError(o?.error || o?.message || 'error');
    else if (ev === 'done') onDone(o);
    else if (o?.delta != null) onDelta(o.delta);
  };
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() ?? ''; for (const raw of lines) { const line = raw.replace(/\r$/, ''); if (line === '') { event = 'message'; continue; } if (line.startsWith('event:')) event = line.slice(6).trim(); else if (line.startsWith('data:')) handle(event, line.slice(5).trim()); } } } catch (e) { if (e?.name !== 'AbortError') onError(e?.message); return; }
  onDone(null);
}

const FAI_SUGGEST = [
  'Bu ayın maliyyə xülasəsi',
  'Ən böyük borclular kimlərdir?',
  'CAPEX layihələrinin qalığı nə qədərdir?',
  'Omid balansı necədir?',
  'Son nağd xərclər',
  'Ödənilməmiş lisenziyalar',
];
const FAI_SPIN = ['✶', '✸', '✹', '✺', '✷', '✦'];
const FAI_WORDS = ['Fikirləşir', 'Hesablayır', 'Axtarır', 'Araşdırır', 'Toplayır', 'Qurur', 'Yoxlayır', 'İşləyir'];
const faiElapsed = (t0) => { if (!t0) return '0s'; const s = Math.floor((Date.now() - t0) / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; };

function FaiOrb({ size = 14 }) {
  return (
    <span className="fai-orb" style={{ width: size * 2, height: size * 2 }}>
      <span className="fai-ring" />
      <Sparkles size={size} className="relative z-10 text-white" />
    </span>
  );
}

function FinanceAI({ canDev, canApprove }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('fast');           // fast ⚡ | thinking 🧠 | dev 🛠
  const [model, setModel] = useState('Fable 5 (Mythos)');
  const [pending, setPending] = useState([]);          // backend dev changes awaiting approval
  const [approving, setApproving] = useState(false);
  const [tick, setTick] = useState(0);                 // drives the live progress ticker
  const [atts, setAtts] = useState([]);                // attached photos/files [{name,dataUrl}]
  const thread = useRef(null);
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const onFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    Promise.all(files.map((f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res({ name: f.name, dataUrl: r.result }); r.onerror = () => res(null); r.readAsDataURL(f); })))
      .then((list) => setAtts((a) => [...a, ...list.filter(Boolean)].slice(0, 4)));
    e.target.value = '';
  };
  // Keep the chat pinned to the bottom WITHOUT page jitter: scroll the inner
  // container instantly, and only when the user is already near the bottom.
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, [msgs]);
  // Memory: restore the previous Finance dialogue on mount.
  useEffect(() => {
    api.get('/ai/finance/thread').then((d) => {
      if (d?.messages?.length) { setMsgs(d.messages.map((m) => ({ role: m.role, content: m.content }))); thread.current = d.threadId; }
    }).catch(() => {});
  }, []);
  // Live ticker (spinner + elapsed + tokens) while a response streams.
  useEffect(() => { if (!busy) return; const iv = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(iv); }, [busy]);
  // Only Süleyman (canApprove) polls + sees the deploy-approval queue.
  useEffect(() => {
    if (!canApprove) return;
    let alive = true;
    const load = () => api.get('/finance/dev/pending').then((d) => { if (alive) setPending(d.pending || []); }).catch(() => {});
    load(); const iv = setInterval(load, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [canApprove]);
  const approve = async () => { setApproving(true); try { await api.post('/finance/dev/approve', {}); setPending([]); } catch { /* */ } setTimeout(() => setApproving(false), 5000); };

  const send = (preset) => {
    const t = (preset ?? input).trim(); if ((!t && !atts.length) || busy) return;
    const sendAtts = atts;
    setInput(''); setAtts([]);
    setMsgs((m) => [...m, { role: 'user', content: t, atts: sendAtts.map((a) => a.name) }, { role: 'assistant', content: '', streaming: true, actions: [], startedAt: Date.now() }]);
    setBusy(true);
    const ctrl = new AbortController();
    streamFinanceAI({
      message: t, threadId: thread.current, mode: mode === 'dev' ? 'dev' : mode, attachments: sendAtts, signal: ctrl.signal,
      onMeta: (id) => { if (thread.current == null) thread.current = id; },
      onModel: (o) => { if (o?.label) setModel(o.label); },
      onDelta: (d) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content + d } : x))),
      onAction: (a) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, actions: [...(x.actions || []), a] } : x))),
      onError: (e) => { setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: e || 'AI hazırda əlçatan deyil', error: true, streaming: false } : x))); setBusy(false); },
      onDone: () => { setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, streaming: false } : x))); setBusy(false); },
    });
  };

  return (
    <div className="fin-card fin-rise flex flex-col overflow-hidden fai-term flex-1 min-h-0 w-full" style={{ minHeight: 0 }}>
      <style>{`
        .fai-orb{position:relative;display:inline-grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,${EM},${BLUE});box-shadow:0 0 0 0 rgba(16,185,129,.5);animation:faiPulse 2.6s ease-in-out infinite}
        .fai-ring{position:absolute;inset:-3px;border-radius:16px;background:conic-gradient(from 0deg,${EM},${BLUE},${EM});filter:blur(5px);opacity:.55;animation:faiSpin 4s linear infinite}
        @keyframes faiPulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45)}50%{box-shadow:0 0 18px 3px rgba(59,130,246,.45)}}
        @keyframes faiSpin{to{transform:rotate(360deg)}}
        .fai-dot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 0 0 rgba(16,185,129,.6);animation:faiBeat 1.6s infinite}
        @keyframes faiBeat{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 5px rgba(16,185,129,0)}}
        .fai-caret{display:inline-block;width:7px;height:14px;background:${EM};margin-left:2px;vertical-align:middle;animation:faiBlink 1s steps(2) infinite}
        @keyframes faiBlink{50%{opacity:0}}
        .fai-chip{opacity:0;transform:translateY(6px);animation:faiUp .4s forwards}
        @keyframes faiUp{to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.fai-orb,.fai-ring,.fai-dot,.fai-caret,.fai-chip{animation:none!important}}
        .fai-scroll{scrollbar-width:thin;scrollbar-color:var(--line) transparent;overscroll-behavior:contain}
        .fai-scroll::-webkit-scrollbar{width:7px}
        .fai-scroll::-webkit-scrollbar-track{background:transparent}
        .fai-scroll::-webkit-scrollbar-thumb{background:var(--line);border-radius:9999px}
        .fai-scroll::-webkit-scrollbar-thumb:hover{background:var(--ink-faint)}
      `}</style>

      {/* Header — branded terminal bar */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5 shrink-0" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,.06), transparent)' }}>
        <FaiOrb size={15} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-black leading-tight">
            <span className="fin-grad">Appina Finance AI</span>
            <span className="hidden sm:inline rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: `linear-gradient(135deg,${EM},${BLUE})` }}>{model}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-faint font-mono">
            <span className="fai-dot" /> online · canlı · maliyyə rejimi
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-line p-0.5 bg-bg/60">
          <button onClick={() => setMode('fast')} title="Sürətli" className={`grid place-items-center size-7 rounded-lg ${mode === 'fast' ? 'text-white' : 'text-ink-faint hover:text-ink'}`} style={mode === 'fast' ? { background: `linear-gradient(135deg,${EM},${BLUE})` } : undefined}><Zap size={15} /></button>
          <button onClick={() => setMode('thinking')} title="Düşünən" className={`grid place-items-center size-7 rounded-lg ${mode === 'thinking' ? 'text-white' : 'text-ink-faint hover:text-ink'}`} style={mode === 'thinking' ? { background: `linear-gradient(135deg,${EM},${BLUE})` } : undefined}><Brain size={15} /></button>
          {canDev && <button onClick={() => setMode('dev')} title="Developer — qur / dəyiş / sil" className={`grid place-items-center size-7 rounded-lg ${mode === 'dev' ? 'text-white' : 'text-ink-faint hover:text-ink'}`} style={mode === 'dev' ? { background: 'linear-gradient(135deg,#f59e0b,#ef4444)' } : undefined}><Wrench size={15} /></button>}
        </div>
      </div>

      {/* Süleyman-only deploy approval bar — always visible to id 16 so it's findable */}
      {canApprove && (
        pending.length > 0 ? (
          <div className="flex items-center gap-2.5 border-b border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs">
            <Wrench size={15} className="shrink-0 text-amber-500 animate-pulse" />
            <div className="min-w-0 flex-1 font-sans">
              <b className="text-amber-600">{pending.length} server dəyişikliyi təsdiqinizi gözləyir</b>
              <div className="truncate text-ink-faint">{pending.map((p) => `${p.by}: ${(p.files || []).join(', ')}`).join(' · ')}</div>
            </div>
            <button onClick={approve} disabled={approving} className="shrink-0 rounded-lg px-3 py-1.5 font-bold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>{approving ? 'Yenilənir…' : 'Təsdiqlə & Aktivləşdir'}</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-b border-line px-3.5 py-1.5 text-[11px] font-sans text-ink-faint">
            <ShieldCheck size={13} className="shrink-0" style={{ color: EM }} /> Developer təsdiq paneli (yalnız siz) — hazırda təsdiq gözləyən dəyişiklik yoxdur
          </div>
        )
      )}

      {/* Transcript */}
      <div ref={scrollRef} className="fai-scroll flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[13px]">
        {msgs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-2">
            <FaiOrb size={26} />
            <div className="fin-grad text-2xl font-black mt-3">Fable 5 · Mythos</div>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted font-sans">
              Salam! Mən <b>Appina Finance AI</b>-yam — Süleyman tərəfindən qurulub və proqramlaşdırılmışam,
              maliyyə bölməsinin içində canlı işləyirəm. Hesabatları, borcluları, CAPEX, Omid və nağd xərcləri
              oxuyur, təhlil edir, əlavə edir, dəyişir və silirəm. İstədiyiniz dəyişiklik və ya yeni dəyər olsa —
              peşəkar şəkildə həll edirəm. <span className="text-ink-faint">Yalnız maliyyə daxilində.</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
              {FAI_SUGGEST.map((q, i) => (
                <button key={q} onClick={() => send(q)} className="fai-chip rounded-full border border-line px-3 py-1.5 text-xs font-sans text-ink-muted hover:text-ink hover:border-emerald-500 transition" style={{ animationDelay: `${i * 70}ms` }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && <div className="mt-0.5 shrink-0"><FaiOrb size={13} /></div>}
            <div className={`max-w-[82%] ${m.role === 'user' ? '' : 'w-full'}`}>
              {m.role !== 'user' && <div className="mb-1 flex items-center gap-1.5 text-[10px] text-ink-faint"><Terminal size={11} /> fable5@finance ▸</div>}
              <div className="rounded-2xl px-3.5 py-2 whitespace-pre-wrap break-words"
                style={m.role === 'user' ? { background: EM2, color: '#fff' } : m.error ? { background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.3)' } : { background: 'var(--elevated)', border: '1px solid var(--line)' }}>
                {m.content || (m.streaming ? '' : '')}{m.streaming && <span className="fai-caret" />}
                {!!(m.atts && m.atts.length) && <div className="mt-1 text-[10px] opacity-80">📎 {m.atts.join(', ')}</div>}
              </div>
              {m.streaming && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
                  <span style={{ color: EM }}>{FAI_SPIN[tick % FAI_SPIN.length]}</span>
                  {FAI_WORDS[tick % FAI_WORDS.length]}… ({faiElapsed(m.startedAt)} · ↓ {Math.max(1, Math.round((m.content || '').length / 4))} token)
                </div>
              )}
              {!!(m.actions && m.actions.length) && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.actions.map((a, k) => (
                    <span key={k} className="fai-chip inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-[10px]" style={{ color: a.ok ? EM2 : '#dc2626' }}>
                      <Cpu size={10} /> {a.op}{a.module ? ` ${a.module}` : ''}{a.id ? ` #${a.id}` : ''} {a.ok ? '✓' : '✕'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Attached files preview */}
      {atts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line px-2.5 pt-2">
          {atts.map((a, k) => (
            <span key={k} className="inline-flex items-center gap-1 rounded-lg border border-line bg-elevated px-2 py-1 text-[11px]">
              <Paperclip size={11} /> <span className="max-w-[140px] truncate">{a.name}</span>
              <button onClick={() => setAtts((x) => x.filter((_, j) => j !== k))} className="text-ink-faint hover:text-red-500"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Input — terminal prompt */}
      <div className="border-t border-line p-2.5 flex items-end gap-2">
        <input ref={fileRef} type="file" multiple accept="image/*,.txt,.pdf,.js,.jsx,.ts,.tsx,.json,.csv,.md,.html,.css,.py,.sql" onChange={onFiles} className="hidden" />
        <button onClick={() => fileRef.current?.click()} title="Şəkil / fayl əlavə et" disabled={busy} className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-muted hover:text-ink hover:border-emerald-500 disabled:opacity-40"><Paperclip size={17} /></button>
        <span className="pb-2.5 font-mono font-bold" style={{ color: EM }}>▸</span>
        <input ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={mode === 'dev' ? 'Developer əmri… (məs: CAPEX cədvəlinə sütun əlavə et)' : 'Maliyyə əmri və ya fayl…'} className="flex-1 px-2 py-2.5 text-sm font-mono rounded-xl bg-bg border border-line outline-none focus:border-emerald-500" />
        <button onClick={() => send()} disabled={(!input.trim() && !atts.length) || busy} className="grid size-10 place-items-center rounded-xl text-white disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${EM}, ${BLUE})` }}><ArrowUp size={18} /></button>
      </div>
    </div>
  );
}

function BulkCapexModal({ onClose, onDone }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const parseDate = (s) => { const t = (s || '').trim(); if (!t) return ''; const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t); if (m) return t; const i = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t); if (i) return `${i[3]}.${i[2]}.${i[1]}`; return t; };
  const parseNum = (s) => { const t = String(s || '').trim().replace(/\s/g, '').replace(',', '.'); if (!t) return 0; const n = Number(t); return Number.isFinite(n) ? n : 0; };
  const parse = () => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows = [];
    for (const line of lines) {
      const c = line.split('\t');
      if (c.length < 11) continue;
      rows.push({
        customer_name: (c[0] || '').trim(),
        project_name: (c[1] || '').trim(),
        total_amount: parseNum(c[2]),
        advance_percentage: parseNum(c[3]),
        advance_amount: parseNum(c[4]),
        advance_payment_date: parseDate(c[5]),
        remaining_amount_1: parseNum(c[6]),
        remaining_payment_date_1: parseDate(c[7]),
        remaining_amount_2: parseNum(c[8]),
        remaining_payment_date_2: parseDate(c[9]),
        status: (c[10] || '').trim(),
        notes: (c[11] || '').trim(),
      });
    }
    return rows;
  };
  const submit = async () => {
    setErr(''); setResult(null);
    const rows = parse();
    if (!rows.length) { setErr('Heç bir sətr tanınmadı. Tab-separated olduğundan əmin ol.'); return; }
    setBusy(true);
    try {
      const res = await api.post('/finance/capex/_bulk', { rows });
      setResult(res);
      setTimeout(() => onDone(), 800);
    } catch (e) { setErr(e?.message || 'Xəta'); }
    finally { setBusy(false); }
  };
  const preview = parse();
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="fin-card w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">CAPEX — Toplu yeniləmə</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg"><X size={18} /></button>
        </div>
        <p className="text-xs text-ink-faint mb-2">Tab-separated sütun sırası: <b>müştəri · layihə · cəmi · avans% · avans₼ · avans_tarix · qalıq1 · qalıq1_tarix · qalıq2 · qalıq2_tarix · status · qeyd</b>. Müştəri adı üzrə tapılır → mövcudlar yenilənir, yenilər əlavə olunur.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-bg border border-line outline-none focus:border-emerald-500" placeholder="Abşəron MTK\tAbşəron MTK - Kapital layihəsi\t21998\t80\t17598,4\t18.02.2026\t4399,6\t\t0\t\ttamamlanıb\t&#10;..." />
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
          <span>Tanınan sətrlər: <b className="text-ink">{preview.length}</b></span>
          {err && <span className="text-red-500">{err}</span>}
          {result && <span className="text-emerald-500">Yeniləndi: {result.updated} · Əlavə edildi: {result.inserted}</span>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">Bağla</button>
          <button onClick={submit} disabled={busy || !preview.length} className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>{busy ? 'Göndərilir…' : `Yenilə (${preview.length})`}</button>
        </div>
      </div>
    </div>
  );
}

function BulkLicenseModal({ onClose, onDone }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const parseNum = (s) => { const t = String(s || '').trim().replace(/\s/g, '').replace(',', '.'); if (!t) return 0; const n = Number(t); return Number.isFinite(n) ? n : 0; };
  const parse = () => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows = [];
    for (const line of lines) {
      const c = line.split('\t');
      if (c.length < 3) continue;
      rows.push({ customer_name: (c[0] || '').trim(), month: (c[1] || '').trim(), amount: parseNum(c[2]), status: (c[3] || '').trim(), notes: (c[4] || '').trim() });
    }
    return rows;
  };
  const submit = async () => {
    setErr(''); setResult(null);
    const rows = parse();
    if (!rows.length) { setErr('Heç bir sətr tanınmadı. Tab-separated olduğundan əmin ol.'); return; }
    setBusy(true);
    try { const res = await api.post('/finance/licenses/_bulk', { rows }); setResult(res); setTimeout(() => onDone(), 800); }
    catch (e) { setErr(e?.message || 'Xəta'); } finally { setBusy(false); }
  };
  const preview = parse();
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="fin-card w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Lisenziya — Toplu yeniləmə</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg"><X size={18} /></button>
        </div>
        <p className="text-xs text-ink-faint mb-2">Tab-separated sütun sırası: <b>müştəri · ay · məbləğ · status · qeyd</b>. Müştəri adı üzrə tapılır → mövcudlar yenilənir, yenilər əlavə olunur.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-bg border border-line outline-none focus:border-emerald-500" placeholder="Müştəri adı\t2026-02\t1200\tödənilib\tqeyd" />
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
          <span>Tanınan sətrlər: <b className="text-ink">{preview.length}</b></span>
          {err && <span className="text-red-500">{err}</span>}
          {result && <span className="text-emerald-500">Yeniləndi: {result.updated} · Əlavə edildi: {result.inserted}</span>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">Bağla</button>
          <button onClick={submit} disabled={busy || !preview.length} className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>{busy ? 'Göndərilir…' : `Yenilə (${preview.length})`}</button>
        </div>
      </div>
    </div>
  );
}

function BulkContractModal({ onClose, onDone }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const parse = () => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows = [];
    for (const line of lines) {
      const c = line.split('\t');
      if (c.length < 2) continue;
      rows.push({ contract_no: (c[0] || '').trim(), customer: (c[1] || '').trim(), validity: (c[2] || '').trim(), classification: (c[3] || '').trim(), link: (c[4] || '').trim() });
    }
    return rows;
  };
  const submit = async () => {
    setErr(''); setResult(null);
    const rows = parse();
    if (!rows.length) { setErr('Heç bir sətr tanınmadı. Tab-separated olduğundan əmin ol.'); return; }
    setBusy(true);
    try { const res = await api.post('/finance/contracts/_bulk', { rows }); setResult(res); setTimeout(() => onDone(), 800); }
    catch (e) { setErr(e?.message || 'Xəta'); } finally { setBusy(false); }
  };
  const preview = parse();
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="fin-card w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Müqavilə — Toplu yeniləmə</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg"><X size={18} /></button>
        </div>
        <p className="text-xs text-ink-faint mb-2">Tab-separated sütun sırası: <b>müqavilə № · müştəri · etibarlılıq · təsnifat · link</b>. Müqavilə nömrəsi üzrə tapılır → mövcudlar yenilənir, yenilər əlavə olunur.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-bg border border-line outline-none focus:border-emerald-500" placeholder="MQ-001\tMüştəri adı\t2026-12-31\tMain\thttps://drive..." />
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
          <span>Tanınan sətrlər: <b className="text-ink">{preview.length}</b></span>
          {err && <span className="text-red-500">{err}</span>}
          {result && <span className="text-emerald-500">Yeniləndi: {result.updated} · Əlavə edildi: {result.inserted}</span>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">Bağla</button>
          <button onClick={submit} disabled={busy || !preview.length} className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>{busy ? 'Göndərilir…' : `Yenilə (${preview.length})`}</button>
        </div>
      </div>
    </div>
  );
}

function FinanceForm({ section, row, onClose, onSave, saving }) {
  const fields = FIELDS[section] || [];
  const [form, setForm] = useState(() => { const f = {}; for (const fl of fields) f[fl.key] = row?.[fl.key] ?? ''; return f; });
  const set = (k) => (e) => setForm((p) => {
    const next = { ...p, [k]: e.target.value };
    if (section === 'licenses' && k === 'status' && e.target.value === 'ödənilib' && !String(p.notes ?? '').trim()) {
      next.notes = `${p.customer_name || 'Müştəri adı'} ${p.month || 'ay'} üzrə lisenziya ödənişi`;
    }
    return next;
  });
  const wide = new Set(['notes', 'description', 'link', 'purpose']);
  return (
    <div className="fixed inset-0 z-50 bg-black/55 grid place-items-center p-4" onClick={onClose}>
      <div className="fin-card fin-rise w-full max-w-[92vw] sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 shrink-0">
          <h3 className="flex items-center gap-2 font-bold min-w-0"><span className="size-2.5 rounded-full shrink-0" style={{ background: EM }} /><span className="truncate">{row ? 'Redaktə' : 'Yeni qeyd'}</span></h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink shrink-0"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((fl) => (
            <label key={fl.key} className={`text-sm min-w-0 ${wide.has(fl.key) ? 'sm:col-span-2' : ''}`}>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint truncate">{fl.label}</span>
              {fl.type === 'select' ? (
                <select value={form[fl.key] ?? ''} onChange={set(fl.key)} className="w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-emerald-500">
                  <option value="">—</option>{fl.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={fl.type === 'number' ? 'number' : 'text'} step="any" value={form[fl.key] ?? ''} onChange={set(fl.key)} className="w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 outline-none focus:border-emerald-500" />
              )}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5 shrink-0">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:bg-elevated">Ləğv</button>
          <button onClick={() => onSave(form)} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}>{saving ? '...' : 'Yadda saxla'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Finance() {
  const me = useAuth((s) => s.user);
  const canEditFinance = !!me && (isFullAccess(me.role) || me.finance_access);
  const canFinanceDev = !!me && (me.id === 16 || me.id === 13 || ['super_admin', 'developer', 'owner', 'ceo'].includes(me.role));
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState('panel');
  const [navOpen, setNavOpen] = useState(true); // collapse/expand the finance nav
  const [full, setFull] = useState(true);       // full-screen finance on entry (hides main app nav)
  const nav = useNavigate();
  const active = SECTIONS.find((s) => s.key === section) || SECTIONS[0];

  const { data: dash } = useQuery({ queryKey: ['finance', 'dashboard'], queryFn: () => api.get('/finance/dashboard') });
  // Which finance sections this user may work in (server-enforced; null until loaded = show all).
  const { data: secData } = useQuery({ queryKey: ['finance', 'sections'], queryFn: () => api.get('/finance/sections') });
  const allowedSet = secData?.allowed ? new Set(secData.allowed) : null;
  const visibleSections = SECTIONS.filter((s) => !s.endpoint || !allowedSet || allowedSet.has(s.key));
  // If the current tab got hidden by the section limit, fall back to the panel.
  useEffect(() => { if (allowedSet && active.endpoint && !allowedSet.has(section)) setSection('panel'); }, [allowedSet, section, active.endpoint]);
  const list = useQuery({ queryKey: ['finance', section], queryFn: () => api.get(active.endpoint), enabled: !!active.endpoint && (!allowedSet || allowedSet.has(section)) });

  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const refetchAll = () => { qc.invalidateQueries({ queryKey: ['finance', section] }); qc.invalidateQueries({ queryKey: ['finance', 'dashboard'] }); };
  const save = useMutation({ mutationFn: (form) => (editing?.id ? api.put(`/finance/${section}/${editing.id}`, form) : api.post(`/finance/${section}`, form)), onSuccess: () => { setEditing(null); refetchAll(); } });
  const del = useMutation({ mutationFn: (row) => api.del(`/finance/${section}/${row.id}`), onSuccess: refetchAll });
  // Inline status change (click the status pill in the table).
  const statusM = useMutation({ mutationFn: ({ row, status }) => api.put(`/finance/${section}/${row.id}`, { ...row, status }), onSuccess: refetchAll });
  const cellSave = useMutation({ mutationFn: ({ row, key, value }) => api.put(`/finance/${section}/${row.id}`, { ...row, [key]: value }), onSuccess: refetchAll });
  // Omid alış (purchases with line items) — dedicated CRUD form + mutations.
  const [omidEditing, setOmidEditing] = useState(null); // {} = new, row = edit, null = closed
  const omidSave = useMutation({ mutationFn: (form) => (omidEditing?.id ? api.put(`/finance/omid-alis/${omidEditing.id}`, form) : api.post('/finance/omid-alis', form)), onSuccess: () => { setOmidEditing(null); refetchAll(); } });
  const omidDel = useMutation({ mutationFn: (row) => api.del(`/finance/omid-alis/${row.id}`), onSuccess: refetchAll });
  // Yango — Excel (.xlsx) faylından toplu import.
  const yangoFileRef = useRef(null);
  const yangoImport = useMutation({
    mutationFn: (file) => { const fd = new FormData(); fd.append('file', file); return api.upload('/finance/yango/import', fd); },
    onSuccess: (r) => { refetchAll(); window.alert(`Excel import (toplu yeniləmə): ${r?.updated ?? 0} sətir yeniləndi, ${r?.inserted ?? 0} sətir əlavə olundu${r?.skipped ? `, ${r.skipped} boş sətir ötürüldü` : ''}.`); },
    onError: (e) => window.alert(`Import alınmadı: ${e?.message || e?.code || 'naməlum xəta'}`),
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [colFilters, setColFilters] = useState({});
  const setColFilter = (k, v) => setColFilters((f) => ({ ...f, [k]: v }));
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const toggleSort = (k) => setSort((s) => s.key !== k ? { key: k, dir: 'asc' } : s.dir === 'asc' ? { key: k, dir: 'desc' } : { key: null, dir: 'asc' });
  useEffect(() => { setSearch(''); setPage(1); setColFilters({}); setSort({ key: null, dir: 'asc' }); }, [section]);
  useEffect(() => { setPage(1); }, [search, colFilters, sort]);

  useEffect(() => { const t = setTimeout(() => setReady(true), 1100); return () => clearTimeout(t); }, []);
  if (!ready || !dash) return <div className="flex-1 flex flex-col"><Preload /></div>;

  const allRows = list.data?.items || [];
  const searched = search ? allRows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(search.toLowerCase()))) : allRows;
  const activeFilters = Object.entries(colFilters).filter(([, v]) => v != null && v !== '');
  const filtered = activeFilters.length === 0 ? searched : searched.filter((r) => activeFilters.every(([k, v]) => String(r[k] ?? '').toLowerCase().includes(String(v).toLowerCase())));
  const MONTH_IDX = { yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6, iyul: 7, avqust: 8, sentyabr: 9, oktyabr: 10, noyabr: 11, dekabr: 12 };
  const monthKey = (m) => String(m ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rows = sort.key ? [...filtered].sort((a, b) => { let cmp; if (sort.key === 'month') { const ia = MONTH_IDX[monthKey(a.month)] ?? 99, ib = MONTH_IDX[monthKey(b.month)] ?? 99; cmp = ia - ib; } else { cmp = String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), undefined, { numeric: true }); } return sort.dir === 'desc' ? -cmp : cmp; }) : filtered;
  const PAGE_SIZE = section === 'capex' ? 1000 : 100; // Bütün cədvəllərdə 100 sətir, CAPEX-də hamısı
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportCSV = () => {
    const cols = COLUMNS[section] || FIELDS[section]?.map((f) => ({ key: f.key, label: f.label })) || [];
    if (!cols.length) return;
    const esc = (v) => { const s = String(v ?? '').replace(/"/g, '""'); return /[",\n;]/.test(s) ? `"${s}"` : s; };
    const csv = '﻿' + [cols.map((c) => c.label).join(';'), ...rows.map((r) => cols.map((c) => esc(r[c.key])).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `appina-finance-${section}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className={`fin-app flex min-h-0 ${full ? 'fin-full' : 'h-full'}`}>
      <Style />
      <aside className={`${navOpen ? 'w-[196px]' : 'w-[60px]'} shrink-0 self-start sticky top-0 h-[100dvh] border-r border-line bg-surface/70 backdrop-blur flex flex-col min-h-0 transition-[width] duration-200`}>
        {navOpen ? (
          <div className="flex items-center gap-2 pl-2 pr-2.5 h-[60px] border-b border-line">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${EM}, ${BLUE})` }}><Wallet size={18} /></div>
            <div className="min-w-0 flex-1"><div className="fin-grad text-[17px] font-black leading-none">Finance</div><div className="text-[9px] tracking-wider text-ink-faint uppercase">Appina</div></div>
            <button onClick={() => setNavOpen(false)} title="Bağla" className="shrink-0 p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-[var(--hover)]"><PanelLeftClose size={17} /></button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2.5 border-b border-line">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${EM}, ${BLUE})` }}><Wallet size={18} /></div>
            <button onClick={() => setNavOpen(true)} title="Aç" className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-[var(--hover)]"><PanelLeftOpen size={18} /></button>
          </div>
        )}
        {full && navOpen && (
          <button onClick={() => { setFull(false); nav('/'); }} className="mx-2 mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-ink-muted hover:text-ink hover:bg-[var(--hover)]">
            <ArrowUp size={14} className="-rotate-90" /> Appina-ya qayıt
          </button>
        )}
        <nav className="flex-1 overflow-y-auto pl-1 pr-2 py-2 space-y-0.5 fai-scroll">
          {visibleSections.map((s) => {
            const on = s.key === section;
            return (
              <button key={s.key} onClick={() => setSection(s.key)} title={s.label}
                className={`w-full flex items-center gap-2.5 ${navOpen ? 'px-2' : 'px-0 justify-center'} py-2 rounded-lg text-[13px] font-semibold transition`}
                style={on ? { background: EM + '18', color: EM2, boxShadow: navOpen ? `inset 2px 0 0 ${EM}` : 'none' } : { color: 'var(--ink-muted)' }}>
                <s.icon size={16} color={on ? EM2 : 'currentColor'} /> {navOpen && s.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className={`flex-1 min-w-0 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden ${section === 'ai' ? 'min-h-0 flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`mx-auto w-full max-w-[1400px] sm:px-2 ${section === 'ai' ? 'px-1 pt-3 pb-3 flex-1 min-h-0 flex flex-col' : 'px-1 pt-5 pb-2'}`}>
          {section !== 'ai' && <div className="fin-rise mb-4 flex flex-wrap items-center gap-2.5 -mx-1 px-1 sm:-mx-2 sm:px-2 py-3">
            <active.icon size={22} color={EM2} />
            <h2 className="text-2xl font-black tracking-tight">{active.label}</h2>
            {active.endpoint && <span className="text-xs text-ink-faint">· {rows.length}{search ? `/${allRows.length}` : ''} qeyd</span>}
            {active.endpoint && (
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-ink-faint" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar..." className="w-36 sm:w-52 pl-8 pr-2 py-2 text-sm rounded-lg bg-bg border border-line outline-none focus:border-emerald-500" />
                </div>
                {['capex','licenses','equipment','contracts','numbers','yango','nagd'].includes(section) && activeFilters.length > 0 && <button onClick={() => setColFilters({})} title="Filtrləri sıfırla" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink hover:border-red-500"><X size={14} /> <span className="hidden sm:inline">Filtri sıfırla ({activeFilters.length})</span></button>}
                {(COLUMNS[section] || FIELDS[section]) && <button onClick={exportCSV} title="CSV export" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink hover:border-emerald-500"><Download size={15} /> <span className="hidden sm:inline">Export</span></button>}
                {section === 'yango' && canEditFinance && <>
                  <input ref={yangoFileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) yangoImport.mutate(f); e.target.value = ''; }} />
                  <button onClick={() => yangoFileRef.current?.click()} disabled={yangoImport.isPending} title="Excel (.xlsx) faylından import et" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink hover:border-emerald-500 disabled:opacity-50"><Upload size={15} /> <span className="hidden sm:inline">{yangoImport.isPending ? 'İdxal olunur…' : 'Excel import'}</span></button>
                </>}
                {['capex', 'licenses', 'contracts'].includes(section) && canEditFinance && <button onClick={() => setBulkOpen(true)} title="TSV/CSV mətn yapışdırıb toplu yeniləmə" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink hover:border-emerald-500"><Paperclip size={14} /> <span className="hidden sm:inline">Toplu yeniləmə</span></button>}
                {FIELDS[section] && <button onClick={() => setEditing({})} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}><Plus size={15} /> Əlavə et</button>}
                {section === 'omid' && canEditFinance && <button onClick={() => setOmidEditing({})} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${EM}, ${EM2})` }}><Plus size={15} /> Yeni alış</button>}
              </div>
            )}
          </div>}

          {section === 'nagd' && (
            <div className="fin-card fin-rise mb-4 flex flex-wrap items-center gap-4 p-4">
              <div className="grid size-11 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${EM}, ${BLUE})` }}><Banknote size={22} /></div>
              <div><div className="text-[11px] uppercase tracking-wider text-ink-faint">Ümumi nağd xərc</div><div className="text-2xl font-black" style={{ color: EM2 }}>{money(list.data?.total)}</div></div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-faint"><ImageIcon size={13} /> WhatsApp <b>!nagd-group</b> qrupundan avtomatik qeyd olunur</div>
            </div>
          )}

          {section === 'panel' ? <Panel dash={dash} />
            : section === 'ai' ? <FinanceAI canDev={canFinanceDev} canApprove={me?.id === 16} />
            : list.isLoading ? <div className="grid place-items-center py-20 text-ink-faint">Yüklənir…</div>
            : section === 'omid' ? <OmidView rows={pageRows} canEdit={canEditFinance} onEdit={(o) => setOmidEditing(o)} onDelete={(o) => { if (window.confirm('Bu alış silinsin?')) omidDel.mutate(o); }} />
            : <Table columns={COLUMNS[section]} rows={pageRows}
                statusOpts={STATUS_OPTS[section]} onStatus={STATUS_OPTS[section] ? (row, status) => statusM.mutate({ row, status }) : undefined}
                filters={['capex','licenses','equipment','contracts','numbers','yango','nagd'].includes(section) ? colFilters : undefined}
                onFilter={['capex','licenses','equipment','contracts','numbers','yango','nagd'].includes(section) ? setColFilter : undefined}
                sortable={section === 'licenses' ? ['month'] : undefined} sort={sort} onSort={toggleSort}
                fields={FIELDS[section]}
                onCellSave={canEditFinance && FIELDS[section] ? (row, key, value) => cellSave.mutateAsync({ row, key, value }) : undefined}
                onEdit={FIELDS[section] ? (row) => setEditing(row) : undefined}
                onDelete={FIELDS[section] ? (row) => { if (window.confirm('Bu qeyd silinsin?')) del.mutate(row); } : undefined} />}

          {active.endpoint && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="rounded-lg border border-line px-3 py-1.5 font-semibold disabled:opacity-40 hover:border-emerald-500">‹ Əvvəlki</button>
              <span className="px-2 text-ink-muted">{safePage} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="rounded-lg border border-line px-3 py-1.5 font-semibold disabled:opacity-40 hover:border-emerald-500">Növbəti ›</button>
            </div>
          )}

          <footer className="mt-4 pt-2 border-t border-line text-center">
            <p className="text-xs font-semibold">Appina Finance — Developed by <a href="https://www.linkedin.com/in/elinzrv/" target="_blank" rel="noopener noreferrer" className="fin-grad">Elməddin Nəzərli</a></p>
          </footer>
        </div>
      </section>

      {editing && <FinanceForm section={section} row={editing.id ? editing : null} onClose={() => setEditing(null)} onSave={(form) => save.mutate(form)} saving={save.isPending} />}
      {bulkOpen && section === 'capex' && <BulkCapexModal onClose={() => setBulkOpen(false)} onDone={() => { setBulkOpen(false); refetchAll(); }} />}
      {bulkOpen && section === 'licenses' && <BulkLicenseModal onClose={() => setBulkOpen(false)} onDone={() => { setBulkOpen(false); refetchAll(); }} />}
      {bulkOpen && section === 'contracts' && <BulkContractModal onClose={() => setBulkOpen(false)} onDone={() => { setBulkOpen(false); refetchAll(); }} />}
      {omidEditing && <OmidAlisForm row={omidEditing.id ? omidEditing : null} onClose={() => setOmidEditing(null)} onSave={(form) => omidSave.mutate(form)} saving={omidSave.isPending} />}
    </div>
  );
}
