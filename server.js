require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const {
  CHECKOUT_SECRET_KEY,
  CHECKOUT_API_PREFIX = "https://fikffnpc.api.sandbox.checkout.com",
  PUBLIC_BASE_URL = "http://localhost:4242",
  PROCESSING_CHANNEL_ID = "pc_dl7ldwppxpaurgza6ptpqshyia",
  PORT = 4242,
} = process.env;

// The one "product" this demo store sells. In a real app this would
// come from your database / cart, never from the client.
const DEMO_PRODUCT = {
  name: "Wayne Roast — Single-Origin Coffee (250g)",
  amount_flow: 1800, // minor units -> $18.00
  amount_hpp: 1810, // minor units -> $18.10
  amount_pl: 1820, // minor units -> $18.20
  currency: "USD",
};

// SG
// const DEMO_PAYMENT_METHODS = [
//   "card",
//   "applepay",
//   "googlepay",
//   "paynow"
// ]

// HK
// const DEMO_PAYMENT_METHODS = [
//   "card",
//   "applepay",
//   "googlepay",
//   "alipay_hk"
// ]

// US
const DEMO_PAYMENT_METHODS = [
  "card",
  "applepay",
  "googlepay",
  "paypal"
]

const DEMO_CUSTOMER = {
  name: "Jessica Chan",
  email: "jessica.chan@example.com"
}

const DEMO_BILLING = {
  address: { 
    country: "US",
    address_line1: "123 Ketch Ave",
    address_line2: "Garden Grove",
    city: "Sacramento",
    state: "California",
    zip: "92843"
  }
}





app.post("/create-payment-session", async (req, res) => {
  if (!CHECKOUT_SECRET_KEY) {
    return res.status(500).json({
      error:
        "Missing CHECKOUT_SECRET_KEY. Copy .env.example to .env and add your sandbox secret key.",
    });
  }

  try {
    const response = await fetch(`${CHECKOUT_API_PREFIX}/payment-sessions`, {
      method: "POST",
      headers: {
        Authorization: CHECKOUT_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "Regular",
        amount: DEMO_PRODUCT.amount_flow,
        currency: DEMO_PRODUCT.currency,
        reference: `ORDER-${Date.now()}`,
        billing: DEMO_BILLING,
        customer: DEMO_CUSTOMER,
        processing_channel_id: `${PROCESSING_CHANNEL_ID}`,
        enabled_payment_methods: DEMO_PAYMENT_METHODS,
        success_url: `${PUBLIC_BASE_URL}/success.html`,
        failure_url: `${PUBLIC_BASE_URL}/checkout.html?status=failed`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Checkout.com error:", data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create payment session" });
  }
});

// Hosted Payments Page: Checkout.com hosts an entire branded payment page,
// you just redirect the customer to the URL it returns.
app.post("/create-hosted-payment-page", async (req, res) => {
  if (!CHECKOUT_SECRET_KEY) {
    return res.status(500).json({
      error:
        "Missing CHECKOUT_SECRET_KEY. Copy .env.example to .env and add your sandbox secret key.",
    });
  }

  try {
    const response = await fetch(`${CHECKOUT_API_PREFIX}/hosted-payments`, {
      method: "POST",
      headers: {
        Authorization: CHECKOUT_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "Regular",
        amount: DEMO_PRODUCT.amount_hpp,
        currency: DEMO_PRODUCT.currency,
        reference: `ORDER-${Date.now()}`,
        billing: DEMO_BILLING,
        customer: DEMO_CUSTOMER,
        processing_channel_id: `${PROCESSING_CHANNEL_ID}`,
        allow_payment_methods: DEMO_PAYMENT_METHODS,
        success_url: `${PUBLIC_BASE_URL}/success.html`,
        failure_url: `${PUBLIC_BASE_URL}/index.html?status=failed`,
        cancel_url: `${PUBLIC_BASE_URL}/index.html?status=cancelled`,
        
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Checkout.com error:", data);
      return res.status(response.status).json(data);
    }

    // The redirect URL the customer needs to be sent to.
    res.json({ redirect_url: data._links.redirect.href, raw: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Hosted Payments Page session" });
  }
});

// Payment Links: same idea as Hosted Payments Page, but the link is meant
// to be shareable (email, chat, SMS) rather than triggered from a live page.
// Note: Payment Links must be enabled on your account by Checkout.com first
// (contact your account manager / support) before this endpoint will work.
app.post("/create-payment-link", async (req, res) => {
  if (!CHECKOUT_SECRET_KEY) {
    return res.status(500).json({
      error:
        "Missing CHECKOUT_SECRET_KEY. Copy .env.example to .env and add your sandbox secret key.",
    });
  }

  try {
    const response = await fetch(`${CHECKOUT_API_PREFIX}/payment-links`, {
      method: "POST",
      headers: {
        Authorization: CHECKOUT_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "Regular",
        amount: DEMO_PRODUCT.amount_pl,
        currency: DEMO_PRODUCT.currency,
        reference: `ORDER-${Date.now()}`,
        description: DEMO_PRODUCT.name,
        billing:  DEMO_BILLING,
        customer: DEMO_CUSTOMER,
        processing_channel_id: `${PROCESSING_CHANNEL_ID}`,
        allow_payment_methods: DEMO_PAYMENT_METHODS,
        return_url: `${PUBLIC_BASE_URL}/success.html`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Checkout.com error:", data);
      return res.status(response.status).json(data);
    }

    res.json({ redirect_url: data._links.redirect.href, raw: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Payment Link" });
  }
});

app.listen(PORT, () => {
  console.log(`Demo store running at ${PUBLIC_BASE_URL}`);
});
