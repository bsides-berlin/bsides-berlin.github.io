# Agent Handover Brief

You are picking up an in-progress task from a previous session. Read this entire document before taking any action.

---

## Your job

Complete the setup of an automatic VAT invoice system for two Stripe accounts (BSides Berlin and GopherCon EU), using a shared Vercel serverless webhook.

---

## Context

Natalie Pistunovich (GitHub: Pisush) organises two tech conferences:
- **BSides Berlin** — bsides.berlin — cybersecurity conference
- **GopherCon EU** — gophercon.eu — Go programming conference

Each has its own Stripe account with separate API keys. Customers buy tickets via Stripe Payment Links. The requirement is that every purchase automatically triggers a German VAT invoice (19% MwSt) sent to the customer's email.

Stripe can auto-generate invoices but cannot auto-send them, so a webhook is needed.

---

## What was already done (do not redo this)

### 1. BSides Berlin website (github.com/bsides-berlin/bsides-berlin.github.io)
- `CLAUDE.md` was created documenting the codebase
- A "Buy Tickets" button was added to the header navbar and hero section, linking to `https://buy.stripe.com/00geX4dPM8LqgWQ4gh`
- Both changes were merged to `main` via PR #8

### 2. Webhook code was written
A Vercel serverless function (`api/webhook.js`) was written that:
1. Verifies the Stripe webhook signature
2. On `checkout.session.completed`, fetches the session's line items
3. Gets or creates a Stripe Customer from session details
4. Finds or creates a DE 19% MwSt tax rate in the Stripe account
5. Creates invoice items with VAT applied
6. Creates, finalizes, and marks the invoice as paid (payment already collected)
7. Sends the invoice PDF to the customer's email

### 3. Standalone webhook repo was created
- **Repo:** https://github.com/Pisush/stripe-invoice-webhook
- The repo exists on GitHub but is currently **empty** — the files need to be pushed into it
- The code exists in a branch on the bsides repo (`claude/stripe-invoice-webhook`) as reference, but the canonical home is the standalone repo above

---

## What you need to do

### Task 1 — Populate the webhook repo

Push these exact files to `https://github.com/Pisush/stripe-invoice-webhook` on the `main` branch:

#### `api/webhook.js`
```js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.config = {
  api: { bodyParser: false },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
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

async function createAndSendVATInvoice(session) {
  const email = session.customer_details?.email;
  if (!email) {
    console.warn('Session has no customer email — skipping invoice', session.id);
    return;
  }

  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(
    session.id,
    { expand: ['data.price.product'], limit: 100 }
  );

  let customerId = session.customer;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      name: session.customer_details.name || undefined,
      address: session.customer_details.address || undefined,
    });
    customerId = customer.id;
  }

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

  await stripe.invoices.finalizeInvoice(invoice.id);
  await stripe.invoices.pay(invoice.id, { paid_out_of_band: true });
  await stripe.invoices.sendInvoice(invoice.id);

  console.log(`Invoice ${invoice.id} sent to ${email} for session ${session.id}`);
}
```

#### `package.json`
```json
{
  "name": "stripe-invoice-webhook",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "stripe": "^17.0.0"
  }
}
```

#### `vercel.json`
```json
{
  "functions": {
    "api/webhook.js": {
      "memory": 128,
      "maxDuration": 15
    }
  }
}
```

#### `.gitignore`
```
node_modules/
.vercel/
.env
.env.local
```

#### `README.md`
```md
# stripe-invoice-webhook

Shared Vercel serverless function that automatically sends a German VAT (19% MwSt)
invoice to customers after a Stripe checkout is completed.

Used by BSides Berlin and GopherCon EU — deployed as two separate Vercel projects,
each with their own Stripe credentials as environment variables.

## Environment variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key for the relevant account |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard |

## Deployment

See AGENT_HANDOVER.md in bsides-berlin/bsides-berlin.github.io for full setup steps.
```

---

### Task 2 — Deploy to Vercel (twice)

The same repo is deployed as two separate Vercel projects, one per Stripe account.

#### BSides Berlin
1. vercel.com → **Add New → Project** → import `Pisush/stripe-invoice-webhook`
2. Framework preset: **Other**, project name: `bsides-invoice-webhook`
3. Add env vars (do NOT commit these — Vercel dashboard only):
   - `STRIPE_SECRET_KEY` = BSides Berlin Stripe secret key (Natalie will provide)
   - `STRIPE_WEBHOOK_SECRET` = fill in after step 5
4. Click **Deploy**, note the URL (e.g. `bsides-invoice-webhook.vercel.app`)
5. BSides Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
   - URL: `https://bsides-invoice-webhook.vercel.app/api/webhook`
   - Event to listen for: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`)
6. Paste signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel → **Redeploy**

#### GopherCon EU
Same steps, but:
- Project name: `gophercon-invoice-webhook`
- Use GopherCon Stripe secret key and its own webhook signing secret
- Register the webhook in the GopherCon Stripe account (separate login)

---

### Task 3 — Test each deployment

With the Stripe CLI installed:
```bash
stripe trigger checkout.session.completed
```
Then check Stripe Dashboard → **Billing → Invoices**. You should see:
- A finalized invoice
- Status: paid
- 19% MwSt line item
- Sent to the test customer's email

---

### Task 4 — Close PR #9 on the bsides repo

`bsides-berlin/bsides-berlin.github.io#9` (branch `claude/stripe-invoice-webhook`) contains an earlier version of the webhook code that was intended to live in the bsides repo. It is now superseded by the standalone repo. Close this PR without merging.

---

## Important notes

- **Never commit Stripe API keys to any repository.** They go in Vercel environment variables only.
- The webhook repo (`Pisush/stripe-invoice-webhook`) is private.
- Both Stripe accounts are completely separate — do not mix up keys between BSides and GopherCon.
- The bsides website is a static GitHub Pages site. The webhook is a separate Vercel deployment — they do not interfere with each other.
- Natalie's GitHub username is `Pisush`.
