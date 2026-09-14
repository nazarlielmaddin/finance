// Daily finance digest / overdue reminder pushed to the Appina Finance WhatsApp group.
import { financeDb } from './finance-db.js';
import * as whatsapp from './whatsapp.js';
import { logger } from './logger.js';

const money = (n) => Number(n || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₼';
const DEBT = '(total_amount - advance_amount - remaining_amount_1 - remaining_amount_2)';

export async function sendFinanceDigest() {
  try {
    if (!whatsapp.getStatus?.().connected) return 0;
    const d = financeDb();
    const qaliq = d.prepare(`SELECT COALESCE(SUM(${DEBT}),0) AS s FROM capex_projects WHERE status='davam edir'`).get().s;
    const active = d.prepare("SELECT COUNT(*) AS n FROM capex_projects WHERE status='davam edir'").get().n;
    const eqDebt = d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM equipment_services WHERE status='borcludur'").get().s;
    const eqCnt = d.prepare("SELECT COUNT(*) AS n FROM equipment_services WHERE status='borcludur'").get().n;
    const licUnpaid = d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM license_payments WHERE status<>'ödənilib'").get().s;
    const text = [
      '💚👑 *Appina Finance — günlük xülasə*',
      '━━━━━━━━━━━━━━━━',
      `📊 CAPEX qalıq borc: *${money(qaliq)}*  (${active} aktiv)`,
      `🔧 Avadanlıq borcu: *${money(eqDebt)}*  (${eqCnt} müştəri)`,
      `📄 Ödənilməmiş lisenziya: *${money(licUnpaid)}*`,
      '━━━━━━━━━━━━━━━━',
      '_Appina Finance Management_',
    ].join('\n');
    const sent = await whatsapp.sendToFinanceGroups(text);
    logger.info({ sent }, 'finance digest sent');
    return sent;
  } catch (err) {
    logger.error({ err: err.message }, 'finance digest failed');
    return 0;
  }
}

// Fire roughly once a day (timer resets on restart — fine for a periodic reminder).
export function scheduleFinanceDigest() {
  setInterval(() => { sendFinanceDigest().catch(() => {}); }, 24 * 60 * 60 * 1000);
}
