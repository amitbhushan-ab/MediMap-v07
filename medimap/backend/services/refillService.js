// backend/services/refillService.js
// Shared refill-reminder logic:
//   * mail / WhatsApp delivery (console fallbacks in development)
//   * recording reminders on the customer timeline
//   * the automated daily job that reminds customers whose refill day is near
const nodemailer = require('nodemailer');

const Pharmacist = require('../models/Pharmacist');
const RegularCustomer = require('../models/RegularCustomer');

// ── Mailer — real nodemailer (console fallback in dev) ──────────
function getMailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS } });
  }
  return {
    sendMail: async (opts) => {
      console.log('\n📧 ─── EMAIL (DEV: set SMTP_* or GMAIL_* in .env to send real emails) ───');
      console.log(`To: ${opts.to}\nSubject: ${opts.subject}\n${(opts.text || '').slice(0, 400)}`);
      console.log('────────────────────────────────────────────────────────────────────────\n');
      return { messageId: `dev_${Date.now()}`, accepted: [opts.to] };
    },
  };
}

// ── WhatsApp Cloud API (used only when credentials are configured) ──
async function sendWhatsAppMessage(phone, text) {
  if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_PHONE_ID) return null;
  const to = `91${String(phone).replace(/\D/g, '').slice(-10)}`;
  const res = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error?.message || `WhatsApp send failed (${res.status})`);
  return data.messages?.[0]?.id;
}

/** True when a reminder can actually leave the building for this customer. */
function hasDeliverableChannel(customer) {
  if (customer.email) return true;
  return Boolean(customer.phone && process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_ID);
}

// ── Message + delivery ─────────────────────────────────────────
function buildRefillMessage(pharmacy, customer, medicineName) {
  const medicine = customer.medicines.find(m => m.medicineName === medicineName) || null;
  const subject = medicineName ? `Your ${medicineName}` : 'Your regular medicines';
  const timing = medicine?.typicalDate ? ` around day ${medicine.typicalDate}` : '';
  return `Hello ${customer.name}, this is ${pharmacy.name}. ${subject} may be due for a refill${timing}. ` +
    `Call us on ${pharmacy.phone || 'the store'} and we will keep it ready.`;
}

/**
 * Sends one reminder and appends it to the customer timeline.
 * Email is used when the customer has one, WhatsApp when its API keys exist,
 * otherwise the reminder is only recorded — never claimed as delivered.
 */
async function deliverReminder({ customer, pharmacy, medicineName, message, source = 'manual' }) {
  let channel = 'log';
  let status = 'logged';
  let error = '';

  if (customer.email) {
    channel = 'email';
    try {
      await getMailer().sendMail({
        from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@medimap.in',
        to: customer.email,
        subject: `Refill reminder for ${medicineName || 'your medicines'} — ${pharmacy.name}`,
        text: message,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <div style="background:#047857;color:white;padding:14px 20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:17px">Refill reminder</h2>
          </div>
          <div style="border:1px solid #d1fae5;border-top:none;padding:20px;border-radius:0 0 8px 8px">
            <p>Dear <b>${customer.name}</b>,</p>
            <p>${message}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0"/>
            <p style="font-size:12px;color:#6b7280">${pharmacy.name}<br/>${pharmacy.address || ''}<br/>${pharmacy.phone || ''}</p>
          </div>
        </div>`,
      });
      status = 'sent';
    } catch (mailErr) {
      error = mailErr.message;
      status = 'failed';
      console.error('Refill email error:', mailErr.message);
    }
  } else if (customer.phone) {
    try {
      const messageId = await sendWhatsAppMessage(customer.phone, message);
      if (messageId) {
        channel = 'whatsapp';
        status = 'sent';
      }
    } catch (waErr) {
      channel = 'whatsapp';
      error = waErr.message;
      status = 'failed';
      console.error('Refill WhatsApp error:', waErr.message);
    }
  }

  customer.reminders.push({
    channel,
    medicineName,
    message,
    status,
    error: error || undefined,
    source,
    cycle: refillCycle(),
    sentAt: new Date(),
  });
  if (customer.reminders.length > 20) customer.reminders = customer.reminders.slice(-20);
  if (status === 'sent') customer.lastReminderAt = customer.reminders[customer.reminders.length - 1].sentAt;
  await customer.save();

  return { channel, status, error, reminder: customer.reminders[customer.reminders.length - 1] };
}

/** The human-readable outcome string shown by the pharmacy dashboard. */
function describeReminderOutcome({ channel, status, error, customer }) {
  if (status === 'sent') {
    return channel === 'email'
      ? `Refill reminder emailed to ${customer.email}.`
      : `Refill reminder sent on WhatsApp to ${customer.phone}.`;
  }
  if (status === 'failed') return `Reminder saved, but ${channel} delivery failed: ${error}`;
  return 'Reminder logged. Add an email or WhatsApp number to deliver it automatically.';
}

// ── Due-date maths ─────────────────────────────────────────────
function refillCycle(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** typicalDate is a day of month; clamp it for short months (31 → 28 in Feb). */
function dayInMonth(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}

/**
 * A medicine is due when today falls within its alert window before the
 * refill day, e.g. typicalDate 28 with alertDaysBefore 2 fires on the 26th-28th.
 */
function isMedicineDue(medicine, now = new Date()) {
  if (medicine.alertEnabled === false) return false;
  const day = Number(medicine.typicalDate);
  if (!day) return false;
  const lead = Math.max(0, Number(medicine.alertDaysBefore ?? 1));
  const target = dayInMonth(now.getFullYear(), now.getMonth(), day);
  const diff = target - now.getDate();
  return diff >= 0 && diff <= lead;
}

// ── When will the job next contact this customer? ─────────────
/**
 * The next date the daily job would contact this customer, or null when no
 * medicine is ever due (no dates set, or every one switched off). Mirrors
 * isMedicineDue and the once-per-cycle dedupe so the dashboard badge cannot
 * promise a date the job will not keep.
 */
function nextAutoReminderFor(customer, now = new Date()) {
  let best = null;

  for (const medicine of customer.medicines || []) {
    if (medicine.alertEnabled === false) continue;
    const day = Number(medicine.typicalDate);
    if (!day) continue;
    const lead = Math.max(0, Number(medicine.alertDaysBefore ?? 1));

    // Look at this cycle, then the next one, to skip months already reminded.
    for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
      const monthAnchor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 15);
      const remindedThisCycle = (customer.reminders || []).some(r =>
        r.medicineName === medicine.medicineName && r.cycle === refillCycle(monthAnchor));
      if (remindedThisCycle) continue;

      const target = dayInMonth(now.getFullYear(), now.getMonth() + monthOffset, day);
      const windowStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, target - lead + 1);
      const windowEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset, target, 23, 59, 59);
      if (now > windowEnd) continue; // this cycle's window has passed

      const fires = windowStart > now ? windowStart : now;
      if (!best || fires < best.at) best = { at: fires, medicineName: medicine.medicineName };
      break;
    }
  }

  return best;
}

// ── Automated job ──────────────────────────────────────────────
/**
 * Reminds every due customer of every premium, non-suspended pharmacy.
 * Each medicine is reminded at most once per month (and never twice within
 * 48 hours), so restarts and re-runs cannot spam a patient.
 */
async function runAutoRefillReminders({ pharmacistId } = {}) {
  const now = new Date();
  const cycle = refillCycle(now);
  const summary = { scannedCustomers: 0, due: 0, sent: 0, logged: 0, failed: 0, skipped: 0 };

  const query = { isPremium: true, isSuspended: { $ne: true } };
  if (pharmacistId) query._id = pharmacistId;
  const pharmacies = await Pharmacist.find(query).lean();

  for (const pharmacy of pharmacies) {
    const customers = await RegularCustomer.find({ pharmacistId: pharmacy._id, isActive: true });
    for (const customer of customers) {
      summary.scannedCustomers++;

      if (!hasDeliverableChannel(customer)) { summary.skipped++; continue; }

      for (const medicine of customer.medicines || []) {
        if (!isMedicineDue(medicine, now)) continue;
        summary.due++;

        const recent = (customer.reminders || []).some(reminder =>
          reminder.medicineName === medicine.medicineName &&
          (reminder.cycle === cycle || (reminder.sentAt && now - new Date(reminder.sentAt) < 48 * 3600 * 1000)),
        );
        if (recent) { summary.skipped++; continue; }

        const result = await deliverReminder({
          customer,
          pharmacy,
          medicineName: medicine.medicineName,
          message: buildRefillMessage(pharmacy, customer, medicine.medicineName),
          source: 'auto',
        });
        if (result.status === 'sent') summary.sent++;
        else if (result.status === 'failed') summary.failed++;
        else summary.logged++;
      }
    }
  }

  return summary;
}

/**
 * Daily schedule: one run at AUTO_REMINDERS_HOUR (default 09:00 server time)
 * plus a catch-up run shortly after boot, so a restart does not miss today.
 * AUTO_REMINDERS_ENABLED=false turns the whole thing off.
 */
function startAutoRefillScheduler() {
  if (process.env.AUTO_REMINDERS_ENABLED === 'false') {
    console.log('⏱ Automatic refill reminders disabled (AUTO_REMINDERS_ENABLED=false)');
    return null;
  }

  const hour = Math.min(23, Math.max(0, parseInt(process.env.AUTO_REMINDERS_HOUR, 10) || 9));
  let nextRunTimer = null;
  let bootTimer = null;

  async function run(label) {
    try {
      const summary = await runAutoRefillReminders();
      console.log(
        `⏱ Auto refill reminders (${label}): ${summary.scannedCustomers} customers scanned, ` +
        `${summary.due} due, ${summary.sent} sent, ${summary.failed} failed, ${summary.skipped} skipped`,
      );
    } catch (err) {
      console.error('Auto refill reminder run failed:', err.message);
    }
  }

  function scheduleNext() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    nextRunTimer = setTimeout(() => { run('daily'); scheduleNext(); }, Math.min(next - now, 2 ** 31 - 1));
    if (nextRunTimer.unref) nextRunTimer.unref();
    console.log(`⏱ Automatic refill reminders: next run ${next.toLocaleString('en-IN')}`);
  }

  scheduleNext();
  bootTimer = setTimeout(() => run('startup'), 20 * 1000);
  if (bootTimer.unref) bootTimer.unref();

  return {
    stop() {
      clearTimeout(nextRunTimer);
      clearTimeout(bootTimer);
    },
  };
}

module.exports = {
  getMailer,
  sendWhatsAppMessage,
  hasDeliverableChannel,
  buildRefillMessage,
  deliverReminder,
  describeReminderOutcome,
  refillCycle,
  isMedicineDue,
  nextAutoReminderFor,
  runAutoRefillReminders,
  startAutoRefillScheduler,
};
