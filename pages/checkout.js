
import { useEffect, useState } from "react";

// ===============================
// ELITEPAY CHECKOUT CONFIGURATION
// ===============================
const PROMO_PRICE = 5000;
const REGULAR_PRICE = 7150;
const PAYMENT_WINDOW = 10 * 60;

const BANK_DETAILS = {
  bank: "Nombank",
  accountNumber: "8045946693",
  accountName: "Abdulrahim Usman",
};

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_ELITEPAY_WHATSAPP || "";

const formatMoney = (amount) =>
  `₦${Number(amount).toLocaleString("en-NG")}`;

const pad = (number) => String(number).padStart(2, "0");

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

function saveTx(transaction) {
  const key = "elitepay_transactions";

  try {
    const existing = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    const transactions = Array.isArray(existing)
      ? existing
      : [];

    localStorage.setItem(
      key,
      JSON.stringify([transaction, ...transactions])
    );

    return true;
  } catch (error) {
    console.error("Unable to save transaction:", error);
    return false;
  }
}

export default function Checkout() {
  const [showPromoNotice, setShowPromoNotice] = useState(true);

  const [promoSeconds, setPromoSeconds] = useState(0);
  const [promoReady, setPromoReady] = useState(false);
  const [promoEnded, setPromoEnded] = useState(false);

  const [paymentDeadline, setPaymentDeadline] = useState(null);
  const [paymentSeconds, setPaymentSeconds] =
    useState(PAYMENT_WINDOW);

  const [receipt, setReceipt] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const price = promoReady && promoEnded
    ? REGULAR_PRICE
    : PROMO_PRICE;

  // Countdown to local midnight today.
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    const deadline = midnight.getTime();

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      setPromoSeconds(remaining);
      setPromoEnded(remaining === 0);
      setPromoReady(true);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // Separate 10-minute payment countdown.
  useEffect(() => {
    if (!paymentDeadline) return;

    const updatePaymentCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((paymentDeadline - Date.now()) / 1000)
      );

      setPaymentSeconds(remaining);
    };

    updatePaymentCountdown();

    const interval = setInterval(
      updatePaymentCountdown,
      1000
    );

    return () => clearInterval(interval);
  }, [paymentDeadline]);

  const beginCheckout = () => {
    if (!promoReady) return;

    setError("");
    setMessage("");
    setShowPromoNotice(false);

    setPaymentSeconds(PAYMENT_WINDOW);
    setPaymentDeadline(Date.now() + PAYMENT_WINDOW * 1000);
  };

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(
        BANK_DETAILS.accountNumber
      );
      setMessage("Account number copied successfully.");
      setError("");
    } catch {
      setError("Unable to copy. Please copy the account number manually.");
    }
  };

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) {
      setReceipt(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, WEBP or PDF receipt.");
      event.target.value = "";
      setReceipt(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Receipt must not exceed 5 MB.");
      event.target.value = "";
      setReceipt(null);
      return;
    }

    setReceipt(file);
  };

  const submitPayment = () => {
    setError("");
    setMessage("");

    if (paymentSeconds <= 0) {
      setError("Your payment window has expired. Please restart checkout.");
      return;
    }

    if (busy) return;

    setBusy(true);

    try {
      const id = `EP-${Date.now()}`;

      const transaction = {
        id,
        type: "activation_code",
        amount: price,
        status: "pending",
        createdAt: new Date().toISOString(),
        receiptName: receipt?.name || "",
      };

      const saved = saveTx(transaction);

      if (!saved) {
        setError("Unable to save your transaction. Please try again.");
        return;
      }

      setTransactionId(id);
      setPaymentStatus("pending");
      setMessage(
        "Payment submitted. Your transaction is awaiting confirmation."
      );
    } finally {
      setBusy(false);
    }
  };

  const contactVendor = () => {
    setError("");

    const phone = WHATSAPP_NUMBER.replace(/\D/g, "");

    if (!phone) {
      setError(
        "WhatsApp support is not configured. Set NEXT_PUBLIC_ELITEPAY_WHATSAPP in your environment."
      );
      return;
    }

    const details = [
      "Hello ElitePay Support,",
      "",
      "I need assistance with my activation code payment.",
      `Amount: ${formatMoney(price)}`,
      `Transaction ID: ${transactionId || "Not generated"}`,
      `Receipt: ${receipt?.name || "Not attached yet"}`,
      "",
      "Please help me confirm my payment.",
    ].join("\n");

    const url =
      `https://wa.me/${phone}?text=${encodeURIComponent(details)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <header className="topbar">
          <a href="/dashboard" className="brand">
            <span className="brand-icon">E</span>
            <span>Elite<span className="brand-accent">Pay</span></span>
          </a>

          <a href="/dashboard" className="back-link">
            ← Dashboard
          </a>
        </header>

        <section className="checkout-heading">
          <span className="eyebrow">SECURE CHECKOUT</span>
          <h1>Complete your payment</h1>
          <p>
            Make your payment to purchase your ElitePay
            activation code.
          </p>
        </section>

        <div className="checkout-grid">
          <section className="checkout-card">
            <div className="card-heading">
              <div>
                <h2>Payment details</h2>
                <p>Use the account below to make your transfer.</p>
              </div>
              <span className="secure-badge">Secure</span>
            </div>

            <div className="price-card">
              <div>
                <span className="muted-label">Activation code</span>
                <div className="price">
                  {formatMoney(price)}
                </div>
                {promoReady && !promoEnded && (
                  <div className="price-note">
                    Limited-time promotional price
                  </div>
                )}
                {promoEnded && (
                  <div className="expired-note">
                    Promotional offer has ended.
                  </div>
                )}
              </div>

              {promoReady && !promoEnded && (
                <span className="discount-badge">PROMO</span>
              )}
            </div>

            <div className="section-title">
              <span className="step-number">1</span>
              <h3>Bank transfer</h3>
            </div>

            <div className="bank-card">
              <div className="bank-row">
                <span>Bank name</span>
                <strong>{BANK_DETAILS.bank}</strong>
              </div>

              <div className="bank-row account-row">
                <span>Account number</span>
                <div className="account-number">
                  <strong>{BANK_DETAILS.accountNumber}</strong>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={copyAccountNumber}
                    aria-label="Copy account number"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bank-row">
                <span>Account name</span>
                <strong>{BANK_DETAILS.accountName}</strong>
              </div>

              <div className="transfer-amount">
                <span>Transfer exactly</span>
                <strong>{formatMoney(price)}</strong>
              </div>
            </div>

            <div className="notice">
              <span className="notice-icon">!</span>
              <p>
                Please confirm the account details and transfer
                the exact amount displayed above. Keep your
                payment receipt for confirmation.
              </p>
            </div>

            <div className="section-title receipt-title">
              <span className="step-number">2</span>
              <h3>Upload payment receipt</h3>
            </div>

            <label className="upload-box">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleReceiptChange}
              />
              <span className="upload-icon">↑</span>
              <strong>
                {receipt ? receipt.name : "Choose your receipt"}
              </strong>
              <small>
                JPG, PNG, WEBP or PDF. Maximum 5 MB.
              </small>
            </label>

            {receipt && (
              <button
                type="button"
                className="remove-receipt"
                onClick={() => setReceipt(null)}
              >
                Remove selected receipt
              </button>
            )}

            {paymentDeadline && (
              <div className={`payment-timer ${
                paymentSeconds <= 60 ? "timer-warning" : ""
              }`}>
                <span>Payment window remaining</span>
                <strong>{formatTime(paymentSeconds)}</strong>
              </div>
            )}

            {error && (
              <div className="feedback error" role="alert">
                {error}
              </div>
            )}

            {message && (
              <div className="feedback success" role="status">
                {message}
              </div>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={submitPayment}
              disabled={
                busy ||
                !paymentDeadline ||
                paymentSeconds <= 0 ||
                paymentStatus === "pending"
              }
            >
              {busy
                ? "Submitting..."
                : paymentStatus === "pending"
                ? "Payment submitted"
                : "I have made the payment"}
            </button>

            {paymentStatus === "pending" && (
              <div className="pending-card">
                <strong>Payment awaiting confirmation</strong>
                <p>
                  Transaction ID: <b>{transactionId}</b>
                </p>
                <p>
                  Contact support with your receipt to request
                  payment confirmation.
                </p>
                <button
                  type="button"
                  className="whatsapp-button"
                  onClick={contactVendor}
                >
                  Contact support on WhatsApp
                </button>
              </div>
            )}
          </section>

          <aside className="side-column">
            <div className="summary-card">
              <h3>Order summary</h3>

              <div className="summary-item">
                <span>Product</span>
                <strong>Activation Code</strong>
              </div>

              <div className="summary-item">
                <span>Quantity</span>
                <strong>1</strong>
              </div>

              <div className="summary-divider" />

              <div className="summary-total">
                <span>Total to pay</span>
                <strong>{formatMoney(price)}</strong>
              </div>

              <div className="summary-footnote">
                Your payment will remain pending until
                it is confirmed.
              </div>
            </div>

            <div className="help-card">
              <div className="help-icon">?</div>
              <h3>Need help?</h3>
              <p>
                Our support team can help you with
                payment confirmation.
              </p>
              <button
                type="button"
                className="support-button"
                onClick={contactVendor}
              >
                Contact support
              </button>
            </div>
          </aside>
        </div>

        <footer className="page-footer">
          © {new Date().getFullYear()} ElitePay. All rights reserved.
        </footer>
      </div>

      {showPromoNotice && (
        <div className="modal-overlay">
          <div
            className="promo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-title"
          >
            <div className="promo-icon">%</div>

            {promoEnded ? (
              <>
                <span className="promo-label">PROMOTION ENDED</span>
                <h2 id="promo-title">Today's offer has ended</h2>
                <p>
                  The promotional price is no longer available.
                  You can continue at the regular price.
                </p>
                <div className="promo-price">
                  {formatMoney(REGULAR_PRICE)}
                </div>
                <button
                  type="button"
                  className="promo-button"
                  onClick={beginCheckout}
                >
                  Continue to checkout
                </button>
              </>
            ) : (
              <>
                <span className="promo-label">SPECIAL PROMOTION</span>
                <h2 id="promo-title">Limited-time offer!</h2>
                <p>
                  Get your ElitePay activation code for
                  just <strong>{formatMoney(PROMO_PRICE)}</strong>.
                  This offer ends at midnight today.
                </p>

                <div className="promo-price">
                  {formatMoney(PROMO_PRICE)}
                </div>

                <div className="countdown-label">
                  OFFER ENDS IN
                </div>

                <div className="countdown">
                  <div className="countdown-unit">
                    <strong>
                      {pad(Math.floor(promoSeconds / 3600))}
                    </strong>
                    <span>Hours</span>
                  </div>
                  <div className="countdown-separator">:</div>
                  <div className="countdown-unit">
                    <strong>
                      {pad(Math.floor((promoSeconds % 3600) / 60))}
                    </strong>
                    <span>Minutes</span>
                  </div>
                  <div className="countdown-separator">:</div>
                  <div className="countdown-unit">
                    <strong>{pad(promoSeconds % 60)}</strong>
                    <span>Seconds</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="promo-button"
                  onClick={beginCheckout}
                  disabled={!promoReady || promoSeconds <= 0}
                >
                  {!promoReady
                    ? "Loading offer..."
                    : "Claim Promo & Continue"}
                </button>

                <small className="promo-footnote">
                  Promotional offer expires at local midnight.
                </small>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .checkout-page {
          min-height: 100vh;
          background: #f4f7fb;
          color: #172337;
          padding: 24px 16px 32px;
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .checkout-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 38px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #12243c;
          text-decoration: none;
          font-size: 23px;
          font-weight: 800;
        }

        .brand-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          color: white;
          background: #2563eb;
          font-weight: 800;
        }

        .brand-accent {
          color: #2563eb;
        }

        .back-link {
          color: #526177;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .back-link:hover {
          color: #2563eb;
        }

        .checkout-heading {
          margin-bottom: 26px;
        }

        .eyebrow,
        .promo-label {
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.7px;
        }

        .checkout-heading h1 {
          margin: 8px 0;
          color: #14243b;
          font-size: clamp(25px, 4vw, 34px);
          font-weight: 800;
          letter-spacing: -0.8px;
        }

        .checkout-heading p {
          margin: 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(250px, 0.9fr);
          gap: 22px;
          align-items: start;
        }

        .checkout-card,
        .summary-card,
        .help-card {
          background: #fff;
          border: 1px solid #e8edf4;
          border-radius: 17px;
          box-shadow: 0 7px 28px rgba(25, 45, 80, 0.045);
        }

        .checkout-card {
          padding: 27px;
        }

        .card-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 22px;
        }

        .card-heading h2 {
          margin: 0 0 5px;
          font-size: 19px;
          font-weight: 750;
        }

        .card-heading p {
          margin: 0;
          color: #8792a4;
          font-size: 12px;
          line-height: 1.5;
        }

        .secure-badge {
          color: #15803d;
          background: #eaf8ef;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .price-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 19px;
          margin-bottom: 27px;
          border: 1px solid #dbeafe;
          border-radius: 13px;
          background: #f5f9ff;
        }

        .muted-label {
          display: block;
          color: #7b8799;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .price {
          font-size: 30px;
          line-height: 1.15;
          font-weight: 850;
          color: #1746a2;
          letter-spacing: -0.7px;
        }

        .price-note {
          margin-top: 6px;
          color: #138044;
          font-size: 11px;
          font-weight: 650;
        }

        .expired-note {
          margin-top: 6px;
          color: #b45309;
          font-size: 11px;
        }

        .discount-badge {
          border-radius: 8px;
          background: #dbeafe;
          color: #1d4ed8;
          padding: 7px 10px;
          font-size: 10px;
          letter-spacing: 0.5px;
          font-weight: 850;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .section-title h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
        }

        .step-number {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #e8f0ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 800;
        }

        .bank-card {
          border: 1px solid #e7ecf3;
          background: #fbfcfe;
          border-radius: 12px;
          padding: 5px 17px 16px;
        }

        .bank-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 46px;
          border-bottom: 1px solid #edf0f5;
          font-size: 12px;
        }

        .bank-row > span {
          color: #7c889b;
        }

        .bank-row strong {
          color: #25344a;
          text-align: right;
          font-size: 12px;
        }

        .account-number {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .account-number strong {
          font-size: 14px;
          letter-spacing: 0.3px;
        }

        .copy-button {
          border: 0;
          background: #e8f0ff;
          color: #2456bd;
          border-radius: 6px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .transfer-amount {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          gap: 10px;
        }

        .transfer-amount span {
          color: #6b778a;
          font-size: 12px;
        }

        .transfer-amount strong {
          color: #1746a2;
          font-size: 19px;
          font-weight: 850;
        }

        .notice {
          display: flex;
          gap: 10px;
          padding: 12px;
          margin-top: 14px;
          background: #fff8e9;
          border: 1px solid #f9e5b7;
          border-radius: 10px;
        }

        .notice-icon {
          display: grid;
          place-items: center;
          flex: 0 0 19px;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #f2b846;
          color: #49330b;
          font-weight: 900;
          font-size: 12px;
        }

        .notice p {
          margin: 0;
          color: #775a20;
          font-size: 11px;
          line-height: 1.65;
        }

        .receipt-title {
          margin-top: 26px;
        }

        .upload-box {
          min-height: 112px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px;
          border: 1.5px dashed #b7c8e5;
          border-radius: 12px;
          background: #fbfdff;
          cursor: pointer;
          text-align: center;
        }

        .upload-box:hover {
          background: #f4f8ff;
          border-color: #5c8de6;
        }

        .upload-box input {
          display: none;
        }

        .upload-icon {
          display: grid;
          place-items: center;
          height: 27px;
          width: 27px;
          color: #2563eb;
          border-radius: 50%;
          background: #e8f0ff;
          font-weight: 900;
          font-size: 18px;
        }

        .upload-box strong {
          max-width: 100%;
          overflow-wrap: anywhere;
          color: #344256;
          font-size: 12px;
        }

        .upload-box small {
          color: #98a2b2;
          font-size: 10px;
        }

        .remove-receipt {
          margin-top: 8px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #cc3838;
          font-size: 11px;
          cursor: pointer;
        }

        .payment-timer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #f1f5fb;
          color: #586579;
          font-size: 12px;
        }

        .payment-timer strong {
          font-size: 17px;
          color: #263b5a;
          font-variant-numeric: tabular-nums;
        }

        .timer-warning {
          background: #fff0ec;
          color: #b43c25;
        }

        .timer-warning strong {
          color: #b43c25;
        }

        .feedback {
          margin-top: 13px;
          padding: 11px 12px;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.5;
        }

        .feedback.error {
          background: #fff0f0;
          color: #b42323;
          border: 1px solid #f8cece;
        }

        .feedback.success {
          background: #eaf8ef;
          color: #137b3d;
          border: 1px solid #c8ecd3;
        }

        .primary-button,
        .promo-button {
          width: 100%;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .primary-button {
          margin-top: 17px;
        }

        .primary-button:hover:not(:disabled),
        .promo-button:hover:not(:disabled) {
          background: #174fc9;
        }

        .primary-button:disabled,
        .promo-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pending-card {
          margin-top: 16px;
          padding: 16px;
          border: 1px solid #bfe7cd;
          border-radius: 11px;
          background: #f2fcf5;
          color: #22543a;
        }

        .pending-card > strong {
          font-size: 13px;
        }

        .pending-card p {
          margin: 8px 0;
          font-size: 11px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .whatsapp-button {
          width: 100%;
          padding: 11px;
          margin-top: 7px;
          color: #fff;
          background: #159b53;
          border: 0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .side-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .summary-card,
        .help-card {
          padding: 21px;
        }

        .summary-card h3,
        .help-card h3 {
          margin: 0 0 19px;
          font-size: 15px;
          font-weight: 800;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
          color: #8190a3;
          font-size: 11px;
        }

        .summary-item strong {
          color: #36445a;
          text-align: right;
          font-size: 11px;
        }

        .summary-divider {
          height: 1px;
          background: #edf0f4;
          margin: 17px 0;
        }

        .summary-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #5c6a80;
          font-size: 12px;
        }

        .summary-total strong {
          font-size: 19px;
          color: #1746a2;
          font-weight: 850;
        }

        .summary-footnote {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #edf0f4;
          color: #909bad;
          font-size: 10px;
          line-height: 1.6;
        }

        .help-icon {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          margin-bottom: 12px;
          border-radius: 50%;
          background: #eaf1ff;
          color: #2563eb;
          font-weight: 800;
        }

        .help-card h3 {
          margin-bottom: 8px;
        }

        .help-card p {
          margin: 0 0 16px;
          color: #8792a3;
          font-size: 11px;
          line-height: 1.7;
        }

        .support-button {
          padding: 10px 13px;
          width: 100%;
          color: #2456bd;
          border: 1px solid #d5e3ff;
          border-radius: 8px;
          background: #f4f8ff;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .page-footer {
          margin-top: 28px;
          text-align: center;
          color: #99a3b2;
          font-size: 10px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(9, 20, 39, 0.74);
          backdrop-filter: blur(5px);
        }

        .promo-modal {
          width: 100%;
          max-width: 410px;
          padding: 29px 25px 25px;
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 25px 80px rgba(0,0,0,0.28);
          text-align: center;
          animation: pop-in 0.25s ease-out;
        }

        .promo-icon {
          display: grid;
          place-items: center;
          height: 48px;
          width: 48px;
          margin: 0 auto 15px;
          border-radius: 15px;
          background: #e8f0ff;
          color: #2563eb;
          font-size: 27px;
          font-weight: 900;
        }

        .promo-modal h2 {
          margin: 9px 0 9px;
          color: #17263e;
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.6px;
        }

        .promo-modal > p {
          max-width: 310px;
          margin: 0 auto 17px;
          color: #718096;
          font-size: 12px;
          line-height: 1.7;
        }

        .promo-price {
          color: #1e55c5;
          font-size: 36px;
          font-weight: 900;
          letter-spacing: -1px;
          margin: 10px 0 19px;
        }

        .countdown-label {
          color: #8b96a6;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .countdown {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 21px;
        }

        .countdown-unit {
          min-width: 70px;
          padding: 11px 7px;
          border: 1px solid #e3eaf6;
          border-radius: 10px;
          background: #f5f8fe;
        }

        .countdown-unit strong {
          display: block;
          color: #243c66;
          font-size: 24px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .countdown-unit span {
          display: block;
          margin-top: 3px;
          color: #91a0b5;
          font-size: 9px;
        }

        .countdown-separator {
          color: #9aabc4;
          font-size: 23px;
          font-weight: 700;
          margin-top: -14px;
        }

        .promo-button {
          padding: 14px;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.2);
        }

        .promo-footnote {
          display: block;
          margin-top: 12px;
          color: #9aa3b1;
          font-size: 9px;
        }

        @keyframes pop-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 760px) {
          .checkout-page {
            padding: 17px 13px 25px;
          }

          .topbar {
            margin-bottom: 29px;
          }

          .checkout-grid {
            grid-template-columns: 1fr;
          }

          .checkout-card {
            padding: 20px 16px;
          }

          .side-column {
            display: grid;
            grid-template-columns: 1fr;
          }

          .checkout-heading {
            margin-bottom: 20px;
          }
        }

        @media (max-width: 380px) {
          .promo-modal {
            padding: 24px 15px 20px;
          }

          .countdown {
            gap: 6px;
          }

          .countdown-unit {
            min-width: 62px;
          }

          .price {
            font-size: 26px;
          }

          .account-number {
            gap: 5px;
          }
        }
      `}</style>
    </main>
  );
}
