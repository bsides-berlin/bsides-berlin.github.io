const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SELLER = {
  name:    process.env.COMPANY_NAME    || 'Tick Tech Talks UG',
  street:  process.env.COMPANY_STREET  || 'Danneckerstr. 14',
  city:    process.env.COMPANY_CITY    || '10245 Berlin',
  country: process.env.COMPANY_COUNTRY || 'Germany',
  ustId:   process.env.COMPANY_UST_ID  || 'DE317299628',
  phone:   process.env.COMPANY_PHONE   || '+49 176 15003862',
  email:   'team+bsides@gophercon.eu',
};

const COUNTRY_NAMES = {
  DE: 'Germany', AT: 'Austria', CH: 'Switzerland', NL: 'Netherlands',
  BE: 'Belgium', FR: 'France',  IT: 'Italy',       ES: 'Spain',
  PL: 'Poland',  CZ: 'Czech Republic', SE: 'Sweden', NO: 'Norway',
  DK: 'Denmark', FI: 'Finland', IE: 'Ireland',     PT: 'Portugal',
  GB: 'United Kingdom', US: 'United States',
};

module.exports.config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    try { await generateAndSendInvoice(event.data.object); }
    catch (err) { console.error('Invoice error:', err); return res.status(500).json({ error: err.message }); }
  }
  return res.json({ received: true });
};

async function generateAndSendInvoice(session) {
  const email = session.customer_details?.email;
  if (!email) return;

  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

  let paymentMethodStr = 'Card';
  let receiptNumber = shortId(session.id, 9, 5) + '-' + shortId(session.id, 4, 0);

  if (session.payment_intent) {
    try {
      const pi = await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['latest_charge'] });
      const charge = pi.latest_charge;
      if (charge) {
        if (charge.receipt_number) receiptNumber = charge.receipt_number;
        const card = charge.payment_method_details?.card;
        if (card) paymentMethodStr = `${capitalize(card.brand)} - ${card.last4}`;
      }
    } catch (_) { /* non-fatal */ }
  }

  const invoiceNumber = shortId(session.id, 8, 0).toUpperCase() + '-' + String(session.created % 10000).padStart(4, '0');
  const datePaid = formatDate(new Date(session.created * 1000));
  const currency = session.currency.toUpperCase();

  const pdfBuffer = await buildPDF({
    seller: SELLER,
    customer: { name: session.customer_details.name || '', email, address: session.customer_details.address },
    lineItems,
    invoiceNumber,
    receiptNumber,
    datePaid,
    paymentMethodStr,
    currency,
    amountTotal: session.amount_total,
  });

  await resend.emails.send({
    from: `${SELLER.name} <${SELLER.email}>`,
    to: email,
    subject: `Invoice ${invoiceNumber} – ${SELLER.name}`,
    text: `Dear ${session.customer_details.name || 'Customer'},\n\nPlease find your invoice attached.\n\nThank you!\n${SELLER.name}`,
    attachments: [{ filename: `invoice-${invoiceNumber}.pdf`, content: pdfBuffer }],
  });

  console.log(`Invoice ${invoiceNumber} sent to ${email}`);
}

// Pull N chars from the alphanum-only tail of an ID, offset from the right
function shortId(id, len, offset) {
  const clean = id.replace(/[^a-zA-Z0-9]/g, '');
  return clean.slice(-(len + offset), offset === 0 ? undefined : -offset);
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtAmt(cents, currency) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100);
}

function addressLines(addr) {
  if (!addr) return [];
  const lines = [];
  if (addr.line1) lines.push(addr.line1);
  if (addr.line2) lines.push(addr.line2);
  const city = [addr.postal_code, addr.city].filter(Boolean).join(' ');
  if (city) lines.push(city);
  if (addr.state) lines.push(addr.state);
  const country = addr.country ? (COUNTRY_NAMES[addr.country] || addr.country) : null;
  if (country) lines.push(country);
  return lines;
}

async function buildPDF({ seller, customer, lineItems, invoiceNumber, receiptNumber, datePaid, paymentMethodStr, currency, amountTotal }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const L = 50, R = doc.page.width - 50;
    const contentW = R - L;

    // Totals
    let subtotal = 0, totalTax = 0;
    for (const item of lineItems) {
      subtotal += item.amount_subtotal ?? item.amount_total;
      totalTax += item.amount_tax ?? 0;
    }
    if (totalTax === 0 && subtotal > 0) totalTax = Math.round(subtotal * 19 / 100);

    // ── HEADER ────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(22).text('Receipt', L, 50);
    doc.font('Helvetica-Bold').fontSize(14).text(seller.name, L, 56, { width: contentW, align: 'right' });

    // ── META ──────────────────────────────────────────────────
    let y = 108;
    doc.font('Helvetica').fontSize(10);
    [['Invoice number', invoiceNumber], ['Receipt number', receiptNumber], ['Date paid', datePaid]].forEach(([label, val], i) => {
      doc.text(label, L, y + i * 16).text(val, L + 120, y + i * 16);
    });

    // ── SELLER / BILL TO ──────────────────────────────────────
    y = 178;
    const midX = L + contentW / 2;

    doc.font('Helvetica-Bold').fontSize(10).text(seller.name, L, y);
    doc.font('Helvetica').fontSize(10);
    let sy = y + 16;
    for (const line of [seller.street, `USt-ID: ${seller.ustId}`, seller.city, seller.country, seller.phone, seller.email]) {
      doc.text(line, L, sy); sy += 14;
    }

    doc.font('Helvetica-Bold').fontSize(10).text('Bill to', midX, y);
    doc.font('Helvetica').fontSize(10);
    let cy = y + 16;
    if (customer.name) { doc.text(customer.name, midX, cy); cy += 14; }
    for (const line of addressLines(customer.address)) { doc.text(line, midX, cy); cy += 14; }
    doc.text(customer.email, midX, cy);

    // ── BIG AMOUNT HEADLINE ───────────────────────────────────
    y = 348;
    doc.font('Helvetica-Bold').fontSize(20)
      .text(`${fmtAmt(amountTotal, currency)} paid on ${datePaid}`, L, y);

    // ── LINE ITEMS TABLE ──────────────────────────────────────
    y = 400;
    const C = { desc: L, qty: L + 295, unit: L + 335, tax: L + 400, amt: L + 438 };
    const W = { qty: 34, unit: 58, tax: 30, amt: R - (L + 438) };

    doc.font('Helvetica').fontSize(9).fillColor('#666666');
    doc.text('Description', C.desc, y);
    doc.text('Qty',        C.qty,  y, { width: W.qty,  align: 'right' });
    doc.text('Unit price', C.unit, y, { width: W.unit, align: 'right' });
    doc.text('Tax',        C.tax,  y, { width: W.tax,  align: 'right' });
    doc.text('Amount',     C.amt,  y, { width: W.amt,  align: 'right' });
    doc.fillColor('#000000');

    y += 14;
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).stroke();
    y += 8;

    doc.font('Helvetica').fontSize(9);
    for (const item of lineItems) {
      const qty = item.quantity ?? 1;
      const itemSub = item.amount_subtotal ?? item.amount_total;
      const unitPrice = itemSub / qty;
      const taxPct = (item.amount_subtotal && item.amount_tax)
        ? Math.round(item.amount_tax / item.amount_subtotal * 100)
        : 19;

      const desc = item.description || '';
      const descW = C.qty - C.desc - 8;
      const descH = doc.heightOfString(desc, { width: descW });
      doc.text(desc,                                C.desc, y, { width: descW });
      doc.text(String(qty),                         C.qty,  y, { width: W.qty,  align: 'right' });
      doc.text(fmtAmt(unitPrice, currency),         C.unit, y, { width: W.unit, align: 'right' });
      doc.text(`${taxPct}%`,                        C.tax,  y, { width: W.tax,  align: 'right' });
      doc.text(fmtAmt(item.amount_total, currency), C.amt,  y, { width: W.amt,  align: 'right' });
      y += Math.max(descH, 14) + 8;
    }

    // ── TOTALS ────────────────────────────────────────────────
    y += 6;
    doc.moveTo(C.unit, y).lineTo(R, y).lineWidth(0.5).stroke();
    y += 10;

    const totalRow = (label, cents, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      doc.text(label, C.unit, y, { width: C.amt - C.unit - 5 });
      doc.text(fmtAmt(cents, currency), C.amt, y, { width: W.amt, align: 'right' });
      y += 15;
    };
    totalRow('Subtotal', subtotal);
    totalRow('Total excluding tax', subtotal);
    totalRow(`VAT – Germany (19% on ${fmtAmt(subtotal, currency)})`, totalTax);
    totalRow('Total', subtotal + totalTax);
    totalRow('Amount paid', amountTotal, true);

    // ── PAYMENT HISTORY ───────────────────────────────────────
    y += 18;
    doc.font('Helvetica-Bold').fontSize(14).text('Payment history', L, y);
    y += 22;

    const PH = { method: L, date: L + 185, amt: L + 310, receipt: L + 430 };
    doc.font('Helvetica').fontSize(9).fillColor('#666666');
    doc.text('Payment method', PH.method, y);
    doc.text('Date',           PH.date,   y);
    doc.text('Amount paid',    PH.amt,    y);
    doc.text('Receipt number', PH.receipt, y);
    doc.fillColor('#000000');
    y += 14;
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).stroke();
    y += 8;

    doc.font('Helvetica').fontSize(9);
    doc.text(paymentMethodStr,               PH.method,  y);
    doc.text(datePaid,                       PH.date,    y);
    doc.text(fmtAmt(amountTotal, currency),  PH.amt,     y);
    doc.text(receiptNumber,                  PH.receipt, y);

    // ── FOOTER ────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(9).fillColor('#888888')
      .text('Page 1 of 1', L, doc.page.height - 40, { width: contentW, align: 'right' });

    doc.end();
  });
}
