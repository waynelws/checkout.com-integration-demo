/**
 * Handles the two redirect-based integrations shown on the product page:
 * Hosted Payments Page and Payment Links. Both work the same way from the
 * client's point of view — ask the server for a session, then redirect the
 * browser to the URL it hands back.
 */
async function startRedirectCheckout(endpoint, buttonEl, busyLabel) {
  const originalLabel = buttonEl.textContent;
  const errorEl = document.getElementById(buttonEl.dataset.errorTarget);

  buttonEl.disabled = true;
  buttonEl.textContent = busyLabel;
  if (errorEl) errorEl.textContent = "";

  try {
    const response = await fetch(endpoint, { method: "POST" });
    const data = await response.json();

    if (!response.ok || !data.redirect_url) {
      throw new Error(data.error || "Could not start checkout.");
    }

    window.location.href = data.redirect_url;
  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = err.message || "Something went wrong. Check the server logs.";
    }
    buttonEl.disabled = false;
    buttonEl.textContent = originalLabel;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const hppBtn = document.getElementById("hpp-btn");
  const linkBtn = document.getElementById("payment-link-btn");

  if (hppBtn) {
    hppBtn.addEventListener("click", () =>
      startRedirectCheckout("/create-hosted-payment-page", hppBtn, "Redirecting…")
    );
  }

  if (linkBtn) {
    linkBtn.addEventListener("click", () =>
      startRedirectCheckout("/create-payment-link", linkBtn, "Generating link…")
    );
  }
});
