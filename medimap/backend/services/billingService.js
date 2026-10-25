// backend/services/billingService.js
// FIX #5: WhatsApp (mock) + Email (nodemailer console) + Bill generation FIX #12
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ── Nodemailer transport — uses console if no SMTP configured ──
function getTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Console transport for development
  return {
    sendMail: async (options) => {
      console.log('\n📧 EMAIL (Development Mode — configure SMTP_HOST/SMTP_USER in .env to send real emails):');
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Body:\n${options.text || options.html?.replace(/<[^>]+>/g, '')}`);
      return { messageId: `dev_${Date.now()}`, accepted: [options.to] };
    }
  };
}

// ── Generate bill HTML ────────────────────────────────────────
function generateBillHTML(bill) {
  const rows = bill.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.medicineName}</td>
      <td>${item.batchNo || '-'}</td>
      <td>${item.quantity}</td>
      <td>₹${item.unitPrice}</td>
      <td>${item.gstRate || 0}%</td>
      <td>₹${item.gstAmount || 0}</td>
      <td>₹${item.total}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bill #${bill.id}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #111; font-size: 13px; }
  .header { text-align: center; border-bottom: 2px solid #1B6EF3; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 20px; color: #1B6EF3; margin: 0 0 4px; }
  .header p { margin: 2px 0; color: #555; font-size: 12px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #1B6EF3; color: white; padding: 8px 6px; text-align: left; font-size: 12px; }
  td { padding: 7px 6px; border-bottom: 1px solid #eee; font-size: 12px; }
  tr:nth-child(even) td { background: #f8faff; }
  .totals { text-align: right; margin-top: 12px; }
  .totals p { margin: 4px 0; }
  .grand { font-size: 16px; font-weight: bold; color: #1B6EF3; border-top: 2px solid #1B6EF3; padding-top: 8px; margin-top: 8px; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #888; border-top: 1px dashed #ccc; padding-top: 12px; }
  .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <h1>${bill.pharmacyName || 'MediMap Pharmacy'}</h1>
    <p>${bill.pharmacyAddress || ''}</p>
    <p>📞 ${bill.pharmacyPhone || ''} &nbsp;|&nbsp; GSTIN: ${bill.gstin || 'N/A'} &nbsp;|&nbsp; License: ${bill.licenseNo || 'N/A'}</p>
  </div>
  <div class="meta">
    <div>
      <strong>Bill No:</strong> ${bill.id}<br>
      <strong>Date:</strong> ${new Date(bill.createdAt).toLocaleString('en-IN')}<br>
      <strong>Payment:</strong> ${bill.paymentMode}
      ${bill.couponCode ? `<br><span class="badge">Coupon: ${bill.couponCode}</span>` : ''}
    </div>
    <div style="text-align:right">
      <strong>Patient:</strong> ${bill.customerName || 'Walk-in'}<br>
      <strong>Phone:</strong> ${bill.customerPhone || '-'}<br>
      ${bill.customerAddress ? `<strong>Address:</strong> ${bill.customerAddress}` : ''}
    </div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Medicine</th><th>Batch</th><th>Qty</th><th>Rate</th><th>GST%</th><th>GST Amt</th><th>Total</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <p>Subtotal: <strong>₹${bill.subtotal}</strong></p>
    <p>Total GST: <strong>₹${bill.totalGST}</strong></p>
    ${bill.discount > 0 ? `<p>Discount (${bill.discount}%): <strong>-₹${bill.discountAmount}</strong></p>` : ''}
    <p class="grand">Grand Total: ₹${bill.grandTotal} | ${bill.paymentMode}</p>
  </div>
  <div class="footer">
    Thank you for your purchase! &nbsp;|&nbsp; MediMap Pharmacy Platform<br>
    <em>This is a computer-generated bill. No signature required.</em>
  </div>
</body>
</html>`;
}

// ── Generate WhatsApp message text ────────────────────────────
function generateWhatsAppText(bill) {
  const items = bill.items.map(i => `  • ${i.medicineName} x${i.quantity} = ₹${i.total}`).join('\n');
  return `*${bill.pharmacyName}*
Bill No: #${bill.id}
Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}

*Patient:* ${bill.customerName || 'Walk-in'}

*Medicines:*
${items}

*Subtotal:* ₹${bill.subtotal}
${bill.discount > 0 ? `*Discount (${bill.discount}%):* -₹${bill.discountAmount}\n` : ''}${bill.totalGST > 0 ? `*GST:* ₹${bill.totalGST}\n` : ''}*Total: ₹${bill.grandTotal}*
Payment: ${bill.paymentMode}

Thank you! 💊 MediMap`;
}

// ── Send email bill ───────────────────────────────────────────
async function sendEmailBill(bill, customerEmail) {
  try {
    if (!customerEmail) throw new Error('Customer email not provided');
    const transport = getTransport();
    const html = generateBillHTML(bill);

    const result = await transport.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@medimap.in',
      to: customerEmail,
      subject: `Your Bill #${bill.id} from ${bill.pharmacyName}`,
      html,
      text: generateWhatsAppText(bill).replace(/\*/g, ''),
    });

    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    throw err;
  }
}

// ── Mock WhatsApp send (production: use Twilio/WATI API) ──────
async function sendWhatsAppBill(bill, phoneNumber) {
  try {
    if (!phoneNumber) throw new Error('Phone number not provided');
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const text = generateWhatsAppText(bill);

    if (process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_ID) {
      // Real WhatsApp API (Meta Cloud API)
      const res = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${cleanPhone}`,
          type: 'text',
          text: { body: text },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return { success: true, messageId: data.messages?.[0]?.id };
    }

    // Mock: log to console + return WhatsApp deep link
    console.log('\n💬 WHATSAPP (Mock Mode):');
    console.log(`  To: +91${cleanPhone}`);
    console.log(`  Message:\n${text}`);

    const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    return {
      success: true,
      mock: true,
      waLink,
      message: 'WhatsApp mock sent (check console). Configure WHATSAPP_API_KEY for real sending.',
    };
  } catch (err) {
    console.error('WhatsApp error:', err.message);
    throw err;
  }
}

// ── Generate bill JSON (FIX #12) ──────────────────────────────
function generateBillObject(billData) {
  const { pharmacist, customer, items, discount = 0, paymentMode, couponCode, billCounter } = billData;

  const billItems = items.map(item => {
    const gstRate = parseFloat(item.gstRate || 12);
    const unitPrice = parseFloat(item.price);
    const qty = parseInt(item.quantity);
    const basePrice = unitPrice / (1 + gstRate / 100);
    const gstAmt = (unitPrice - basePrice) * qty;
    return {
      medicineName: item.medicineName || 'Unknown',
      batchNo: item.batchNo || '-',
      expiryDate: item.expiryDate || '-',
      hsn: item.hsn || '30049099',
      gstRate,
      quantity: qty,
      unitPrice,
      basePrice: parseFloat(basePrice.toFixed(2)),
      gstAmount: parseFloat(gstAmt.toFixed(2)),
      total: parseFloat((unitPrice * qty).toFixed(2)),
    };
  });

  const subtotal = billItems.reduce((s, i) => s + i.total, 0);
  const totalGST = billItems.reduce((s, i) => s + i.gstAmount, 0);
  const discountAmount = (subtotal * discount) / 100;
  const grandTotal = subtotal - discountAmount;

  return {
    id: `BILL-${billCounter || Date.now()}`,
    pharmacyName: pharmacist?.name || 'MediMap Pharmacy',
    pharmacyAddress: pharmacist?.address || '',
    pharmacyPhone: pharmacist?.phone || '',
    gstin: pharmacist?.gstin || '',
    licenseNo: pharmacist?.licenseNo || '',
    customerName: customer?.name || 'Walk-in Customer',
    customerPhone: customer?.phone || '',
    customerEmail: customer?.email || '',
    customerAddress: customer?.address || '',
    items: billItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalGST: parseFloat(totalGST.toFixed(2)),
    discount,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    paymentMode: paymentMode || 'Cash',
    couponCode: couponCode || null,
    createdAt: new Date().toISOString(),
  };
}

module.exports = { sendEmailBill, sendWhatsAppBill, generateBillHTML, generateWhatsAppText, generateBillObject };
