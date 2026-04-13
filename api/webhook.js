const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Vercel: disable body parsing so we get the raw bytes for signature verification
module.exports.config = {
  api: { bodyParser: false },
};

// ---------------------------------------------------------------------------
// Raw body helper (needed for stripe.webhooks.constructEvent)
// ---------------------------------------------------------------------------
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await createAndSendVATInvoice(session);
    } catch (err) {
      console.error('Invoice creation failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.json({ received: true });
};

// ---------------------------------------------------------------------------
// Create a VAT invoice for the completed session and send it to the customer
// ---------------------------------------------------------------------------
async function createAndSendVATInvoice(session) {
  const email = session.customer_details?.email;
  if (!email) {
    console.warn('Session has no customer email — skipping invoice', session.id);
    return;
  }

  // 1. Fetch the purchased line items
  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(
    session.id,
    { expand: ['data.price.product'], limit: 100 }
  );

  // 2. Get existing Stripe customer, or create one from the session details
  let customerId = session.customer;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: session.customer_details.name || undefined,
      address: session.customer_details.address || undefined,
    });
    customerId = customer.id;
  }

  // 3. Find or create the German VAT tax rate (19% exclusive)
  const { data: existingRates } = await stripe.taxRates.list({ active: true, limit: 100 });
  let vat = existingRates.find(
    (t) => t.jurisdiction === 'DE' && t.percentage === 19 && !t.inclusive
  );
  if (!vat) {
    vat = await stripe.taxRates.create({
      display_name: 'MwSt (VAT)',
      description: 'German VAT 19%',
      jurisdiction: 'DE',
      percentage: 19,
      inclusive: false,
    });
  }

  // 4. Add one invoice item per purchased line item
  for (const item of lineItems) {
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: item.amount_total,
      currency: item.currency,
      description: item.description,
      quantity: item.quantity ?? 1,
      tax_rates: [vat.id],
    });
  }

  // 5. Create the invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'send_invoice',
    days_until_due: 0,
    auto_advance: false,
    metadata: {
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent ?? '',
    },
  });

  // 6. Finalize (locks the invoice and generates the PDF)
  await stripe.invoices.finalizeInvoice(invoice.id);

  // 7. Mark as paid — payment was already collected via the checkout session
  await stripe.invoices.pay(invoice.id, { paid_out_of_band: true });

  // 8. Send the invoice email to the customer
  await stripe.invoices.sendInvoice(invoice.id);

  console.log(`Invoice ${invoice.id} sent to ${email} for session ${session.id}`);
}
