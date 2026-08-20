/* global CheckoutWebComponents */

// TODO: replace with your own sandbox public key (starts with pk_sbox_...).
// This key is safe to expose in client-side code — it's scoped to
// payment-sessions:pay and vault-tokenization only.
const PUBLIC_KEY = "pk_sbox_om3yrf272nfpvwhr3aif5icxuyx";

const statusEl = document.getElementById("flow-status");

function setStatus(text, state) {
  statusEl.textContent = text;
  statusEl.dataset.state = state || "";
}

(async () => {
  try {
    const sessionResponse = await fetch("/create-payment-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const paymentSession = await sessionResponse.json();

    if (!sessionResponse.ok) {
      console.error("Error creating payment session:", paymentSession);
      setStatus(
        paymentSession.error ||
          "Couldn't start checkout. Check the server logs and your .env keys.",
        "error"
      );
      return;
    }

    const checkout = await CheckoutWebComponents({
      publicKey: PUBLIC_KEY,
      environment: "sandbox",
      locale: "en-US",
      paymentSession,
      onReady: () => setStatus("", ""),
      onPaymentCompleted: (_component, paymentResponse) => {
        console.log("Payment completed:", paymentResponse.id);
        window.location.href = `/success.html?cko-payment-id=${paymentResponse.id}`;
      },
      onChange: (component) => {
        // Useful for enabling/disabling a custom pay button if you build one.
      },
      onError: (component, error) => {
        console.error("Flow error:", error, component && component.type);
        setStatus("Something went wrong with that payment method.", "error");
      },
    });

    const flowComponent = checkout.create("flow");
    flowComponent.mount(document.getElementById("flow-container"));
  } catch (err) {
    console.error(err);
    setStatus("Couldn't load checkout. Is the server running?", "error");
  }
})();

// Handle redirect-based (asynchronous) payment methods and 3DS returning here.
const params = new URLSearchParams(window.location.search);
if (params.get("status") === "failed") {
  setStatus("That payment didn't go through — please try again.", "error");
}
