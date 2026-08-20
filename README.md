# Wayne & Co. — Checkout.com Flow demo

A minimal demo store (one product) wired up to **three** Checkout.com
integration methods, so you can compare them side by side:

| Button | Integration | What happens |
| --- | --- | --- |
| **Checkout with Flow** | [Flow](https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-your-website) | Embedded payment UI, mounted directly in your page |
| **Pay via Hosted Payments Page** | [Hosted Payments Page](https://www.checkout.com/docs/payments/accept-payments/accept-a-payment-on-a-hosted-page) | Customer is redirected to a Checkout.com‑hosted, branded payment page |
| **Get a Payment Link** | [Payment Links](https://www.checkout.com/docs/payments/accept-payments/create-a-payment-link) | Server generates a shareable link (email/SMS/chat); visiting it opens a Hosted Payments Page |

All three follow the same shape: your server creates a session with your
**secret key**, Checkout.com hands back something for the client to use
(session data for Flow, a redirect URL for the other two).

```
├── server.js          Express server:
│                         POST /create-payment-session        (Flow)
│                         POST /create-hosted-payment-page     (Hosted Payments Page)
│                         POST /create-payment-link            (Payment Links)
├── public/
│   ├── index.html      Product page with all three buttons
│   ├── store.js         Handles the HPP + Payment Link buttons (redirect flow)
│   ├── checkout.html   Flow checkout page
│   ├── checkout.js      Creates the session, mounts Flow, handles events
│   ├── success.html    Redirect target after payment
│   └── style.css
└── .env.example
```

## 1. Get sandbox API keys

1. Create a free [test account](https://www.checkout.com/get-test-account).
2. In the [Dashboard](https://dashboard.checkout.com), go to **Developers →
   API keys** and create:
   - A **secret key** scoped to `payment-sessions` — used only on the server.
   - A **public key** scoped to `payment-sessions:pay` and
     `vault-tokenization` — safe to expose in the browser.

## 2. Configure the project

```bash
cd checkout-flow-demo
npm install
cp .env.example .env
```

Edit `.env` and paste in your secret key:

```
CHECKOUT_SECRET_KEY=sk_sbox_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then open `public/checkout.js` and replace the placeholder with your
**public** key:

```js
const PUBLIC_KEY = "pk_sbox_xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
```

(The public key intentionally lives in front-end code — it's the secret
key that must never leave your server.)

## 3. Run it

```bash
npm start
```

Visit `http://localhost:4242`, click **Buy now**, and pay with a
[test card](https://www.checkout.com/docs/developer-resources/testing/test-cards):

- Card number: `4242 4242 4242 4242`
- Expiry: any future date (e.g. `12/30`)
- CVV: `100`

## Hosted Payments Page & Payment Links — one note

**Payment Links must be enabled on your account first.** Unlike Flow and
Hosted Payments Page, it's not on by default in a new sandbox account —
contact Checkout.com support or your account manager to switch it on, or
the `/create-payment-link` endpoint will return an error.

Both endpoints work the same way under the hood:

```js
// Hosted Payments Page
POST https://api.sandbox.checkout.com/hosted-payments
// Payment Links
POST https://api.sandbox.checkout.com/payment-links
```

Both take the same kind of body as the Flow payment session (amount,
currency, reference, customer, billing) and return a `_links.redirect.href`
URL. The server hands that URL back to the browser, and `store.js` redirects
the customer to it — that's the entire client-side integration for these two
methods; there's no script to mount, since Checkout.com hosts the whole page.

## How the Flow integration works

1. `checkout.html` loads Flow's script directly from
   `https://checkout-web-components.checkout.com/index.js` (never self-host
   this file — it's a PCI requirement).
2. `checkout.js` calls your own server (`POST /create-payment-session`).
3. `server.js` calls Checkout.com's `POST /payment-sessions` API with your
   **secret key**, amount, currency, and success/failure URLs, and returns
   the response to the browser.
4. `checkout.js` passes that response into `CheckoutWebComponents(...)` and
   mounts `flow` into `#flow-container`.
5. Flow shows available payment methods, takes the card details itself
   (they never touch your server), and either:
   - fires `onPaymentCompleted` in the browser (synchronous methods), or
   - redirects to your `success_url` / `failure_url` (3DS, redirect-based
     methods like PayPal).

## Going beyond this demo

This demo trusts the browser redirect as "the order succeeded." For a real
store, also:

- **Verify with a webhook.** Configure a webhook endpoint in the Dashboard
  and only fulfill orders once you receive the `payment_approved` /
  `payment_captured` event — the redirect alone isn't proof of payment.
- **Drive the amount from your cart/database**, not a hardcoded constant.
- **Add error handling and retries** around the session-creation call.
- **Move to production keys and `environment: "production"`** when you're
  ready to go live, and complete Checkout.com's PCI/onboarding requirements.
