// pages/buy-code.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import { loadUser, saveTx } from "../utils/storage";

const CODE_PRICE = 7000;

// WhatsApp support number — kept clean to avoid hidden Unicode characters.
const WA_NUMBER = "2348068991240";

const ONLINE_PAYMENT_URL =
  "https://checkout.korapay.com/pay/elitepayng";

const ONLINE_RETURN_PATH = "/code?payment=online";

function LockIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CreditCardIcon({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3 10h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SupportIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 11.5a8 8 0 0 1-8 8H7l-3 2v-5.2a8 8 0 1 1 16-4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h.01M12 12h.01M16 12h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m13 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export default function BuyCode() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [user, setUser] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const modalRef = useRef(null);
  const nameInputRef = useRef(null);
  const buyButtonRef = useRef(null);

  useEffect(() => {
    const savedUser = loadUser();

    if (!savedUser) {
      router.push("/login");
      return;
    }

    setUser(savedUser);
    setConfirmName(savedUser.fullName || "");
    setPhone(savedUser.phone || "");
  }, [router]);

  const normalizePhone = (value) => {
    let normalized = String(value || "").replace(/\s+/g, "");

    if (normalized.startsWith("+234")) {
      normalized = "0" + normalized.slice(4);
    }

    return normalized.replace(/[^0-9]/g, "").slice(0, 11);
  };

  const handleBuyClick = (event) => {
    event.preventDefault();

    buyButtonRef.current = event.currentTarget;
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) {
      if (buyButtonRef.current) {
        buyButtonRef.current.focus();
      }

      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 80);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !processing) {
        setShowModal(false);
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusable = modal.querySelectorAll(
        'button:not([disabled]), input, a[href]'
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal, processing]);

  const openWhatsAppSupport = () => {
    const message =
      `Hello ElitePay Support, I need assistance with my withdrawal code purchase.\n\n` +
      `Name: ${confirmName || "Not provided"}\n` +
      `Phone: ${phone || "Not provided"}\n` +
      `Amount: NGN ${CODE_PRICE.toLocaleString()}`;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openOnlinePayment = () => {
    const nameToUse = (confirmName || user?.fullName || "").trim();
    const phoneToUse = normalizePhone(phone || user?.phone || "");

    if (!nameToUse) {
      alert(
        "Your account name was not found. Please update your profile first."
      );
      return;
    }

    if (!phoneToUse) {
      alert(
        "Your account phone number was not found. Please update your profile first."
      );
      return;
    }

    setProcessing(true);

    try {
      const redirectUrl = new URL(
        ONLINE_RETURN_PATH,
        window.location.origin
      ).toString();

      const paymentUrl = new URL(ONLINE_PAYMENT_URL);

      /*
       * Keep your payment gateway URL while attaching the return URL.
       * Your gateway should return the customer to /code?payment=online
       * after payment processing.
       */
      paymentUrl.searchParams.set("redirect_url", redirectUrl);

      saveTx({
        type: "buy_code",
        amount: CODE_PRICE,
        status: "pending",
        meta: {
          gateway: "korapay",
          payment_method: "online",
          customer_name: nameToUse,
          customer_phone: phoneToUse,
          redirect_url: redirectUrl,
        },
        created_at: new Date().toISOString(),
      });

      setTimeout(() => {
        window.location.assign(paymentUrl.toString());
      }, 500);
    } catch (error) {
      console.error("Payment initialization error:", error);
      setProcessing(false);

      alert(
        "Unable to start the online payment. Please check your internet connection and try again."
      );
    }
  };

  return (
    <Layout title="Buy Withdrawal Code - ElitePay">
      <div className="buy-code-shell">
        <div className="buy-code-container">
          {/* HEADER */}
          <motion.section
            className="hero-section"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="secure-badge">
              <LockIcon size={14} />
              <span>SECURE ONLINE CHECKOUT</span>
            </div>

            <h1>Activate Your Withdrawal Access</h1>

            <p className="hero-description">
              Purchase your ElitePay withdrawal activation code securely
              online. Your payment is processed electronically and your
              activation will be handled automatically after successful
              payment confirmation.
            </p>

            <div className="hero-price">
              <div>
                <span className="price-caption">Activation Code</span>
                <span className="price-value">
                  ₦{CODE_PRICE.toLocaleString()}
                </span>
              </div>

              <div className="price-chip">
                One-time payment
              </div>
            </div>
          </motion.section>

          {/* PAYMENT CARD */}
          <motion.section
            className="payment-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            <div className="payment-card-top">
              <div className="payment-method-icon">
                <CreditCardIcon size={30} />
              </div>

              <div className="payment-method-info">
                <span className="payment-method-label">
                  PAYMENT METHOD
                </span>

                <h2>Online Payment</h2>

                <p>
                  Pay securely using your available online payment option.
                </p>
              </div>

              <div className="recommended-pill">
                Recommended
              </div>
            </div>

            <div className="payment-divider" />

            <div className="payment-summary">
              <div className="summary-row">
                <span>Product</span>
                <strong>Withdrawal Activation Code</strong>
              </div>

              <div className="summary-row">
                <span>Payment type</span>
                <strong>Online / Automatic</strong>
              </div>

              <div className="summary-row total-row">
                <span>Total amount</span>
                <strong>
                  ₦{CODE_PRICE.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="benefits">
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckIcon />
                </span>
                <span>Secure online payment</span>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckIcon />
                </span>
                <span>Automatic payment verification</span>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckIcon />
                </span>
                <span>Fast activation after confirmation</span>
              </div>
            </div>

            <button
              className="primary-payment-button"
              onClick={handleBuyClick}
              type="button"
            >
              <span>Continue to Online Payment</span>
              <ArrowIcon />
            </button>

            <div className="secure-payment-note">
              <LockIcon size={14} />
              <span>
                You will be redirected to our secure payment gateway.
              </span>
            </div>
          </motion.section>

          {/* SUPPORT */}
          <motion.section
            className="support-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
          >
            <div className="support-icon">
              <SupportIcon />
            </div>

            <div className="support-content">
              <h3>Need help with your payment?</h3>

              <p>
                Contact ElitePay support if you have any difficulty completing
                your online payment.
              </p>
            </div>

            <button
              className="support-button"
              onClick={openWhatsAppSupport}
              type="button"
            >
              Contact Support
            </button>
          </motion.section>

          <div className="footer-note">
            <LockIcon size={13} />
            <span>
              Secure checkout • Online payment • Automatic verification
            </span>
          </div>

          {/* CONFIRMATION MODAL */}
          <AnimatePresence>
            {showModal && (
              <motion.div
                className="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!processing) {
                    setShowModal(false);
                  }
                }}
              >
                <motion.div
                  className="modal"
                  ref={modalRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="confirm-title"
                  initial={{
                    opacity: 0,
                    y: 25,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 15,
                    scale: 0.97,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 340,
                    damping: 27,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="modal-icon">
                    <CreditCardIcon size={25} />
                  </div>

                  <div className="modal-header">
                    <h3 id="confirm-title">
                      Confirm Your Details
                    </h3>

                    <p>
                      Please confirm the information below before continuing
                      to secure online payment.
                    </p>
                  </div>

                  <div className="customer-details">
                    <div className="detail-row">
                      <span>Full name</span>
                      <strong>
                        {confirmName || "Not provided"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>Phone number</span>
                      <strong>
                        {phone || "Not provided"}
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>Purchase</span>
                      <strong>
                        Withdrawal Code
                      </strong>
                    </div>

                    <div className="detail-row">
                      <span>Amount</span>
                      <strong>
                        ₦{CODE_PRICE.toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="confirm-name">
                      Full Name
                    </label>

                    <input
                      id="confirm-name"
                      ref={nameInputRef}
                      value={confirmName}
                      onChange={(event) =>
                        setConfirmName(event.target.value)
                      }
                      disabled={processing}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="confirm-phone">
                      Phone Number
                    </label>

                    <input
                      id="confirm-phone"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      disabled={processing}
                      placeholder="Enter your phone number"
                      inputMode="tel"
                    />
                  </div>

                  <div className="modal-security">
                    <LockIcon size={15} />

                    <span>
                      Your details will be used to identify your payment and
                      activate your purchase.
                    </span>
                  </div>

                  <div className="modal-actions">
                    <button
                      className="continue-button"
                      onClick={openOnlinePayment}
                      disabled={
                        !confirmName.trim() ||
                        !phone.trim() ||
                        processing
                      }
                      type="button"
                    >
                      {processing ? (
                        <span className="button-loading">
                          <Spinner />
                          Preparing secure payment...
                        </span>
                      ) : (
                        <>
                          <span>Proceed to Secure Payment</span>
                          <ArrowIcon />
                        </>
                      )}
                    </button>

                    <button
                      className="cancel-button"
                      onClick={() => setShowModal(false)}
                      disabled={processing}
                      type="button"
                    >
                      Go Back
                    </button>
                  </div>

                  <div className="gateway-note">
                    Secure payment powered by your online payment gateway.
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        .buy-code-shell {
          min-height: calc(100vh - 160px);
          padding: 28px 16px 45px;
          background:
            radial-gradient(
              circle at top,
              rgba(37, 99, 235, 0.08),
              transparent 35%
            ),
            #f8fafc;
        }

        .buy-code-container {
          width: min(620px, 100%);
          margin: 0 auto;
        }

        /* HERO */

        .hero-section {
          text-align: center;
          margin-bottom: 22px;
        }

        .secure-badge {
          width: fit-content;
          margin: 0 auto 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 999px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.08em;
        }

        .hero-section h1 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(28px, 5vw, 38px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .hero-description {
          max-width: 520px;
          margin: 12px auto 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.65;
        }

        .hero-price {
          width: min(460px, 100%);
          margin: 20px auto 0;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          text-align: left;
          border-radius: 15px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
        }

        .price-caption {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 3px;
        }

        .price-value {
          display: block;
          color: #0f172a;
          font-size: 24px;
          font-weight: 950;
        }

        .price-chip {
          padding: 7px 10px;
          border-radius: 999px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        /* PAYMENT CARD */

        .payment-card {
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.09);
        }

        .payment-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
        }

        .payment-method-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
        }

        .payment-method-info {
          flex: 1;
          min-width: 0;
        }

        .payment-method-label {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.1em;
          margin-bottom: 3px;
        }

        .payment-method-info h2 {
          margin: 0;
          color: #0f172a;
          font-size: 19px;
          font-weight: 950;
        }

        .payment-method-info p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }

        .recommended-pill {
          flex-shrink: 0;
          padding: 6px 8px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #15803d;
          border: 1px solid #bbf7d0;
          font-size: 9px;
          font-weight: 950;
        }

        .payment-divider {
          height: 1px;
          background: #eef2f7;
        }

        .payment-summary {
          padding: 18px 20px 8px;
        }

        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 9px 0;
          color: #64748b;
          font-size: 12px;
        }

        .summary-row strong {
          color: #0f172a;
          font-weight: 850;
          text-align: right;
        }

        .total-row {
          margin-top: 4px;
          padding-top: 14px;
          border-top: 1px dashed #e2e8f0;
        }

        .total-row span {
          color: #334155;
          font-weight: 900;
        }

        .total-row strong {
          color: #2563eb;
          font-size: 21px;
          font-weight: 950;
        }

        .benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 8px 20px 18px;
        }

        .benefit-item {
          min-height: 76px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 7px;
          text-align: center;
          background: #f8fafc;
          border: 1px solid #edf2f7;
          border-radius: 11px;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.35;
        }

        .benefit-icon {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
        }

        .primary-payment-button {
          width: calc(100% - 40px);
          margin: 0 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 13px;
          padding: 15px 18px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 16px 30px rgba(37, 99, 235, 0.22);
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .primary-payment-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 19px 35px rgba(37, 99, 235, 0.26);
        }

        .secure-payment-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 20px 18px;
          color: #94a3b8;
          font-size: 10px;
          text-align: center;
        }

        /* SUPPORT */

        .support-card {
          margin-top: 15px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
        }

        .support-icon {
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f1f5f9;
          color: #475569;
        }

        .support-content {
          flex: 1;
          min-width: 0;
        }

        .support-content h3 {
          margin: 0;
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
        }

        .support-content p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.4;
        }

        .support-button {
          flex-shrink: 0;
          border: 1px solid #dbe3ec;
          border-radius: 10px;
          padding: 9px 11px;
          background: #ffffff;
          color: #334155;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .footer-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 14px;
          color: #94a3b8;
          font-size: 9px;
          text-align: center;
        }

        /* MODAL */

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.64);
          backdrop-filter: blur(7px);
        }

        .modal {
          width: min(440px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          padding: 21px;
          background: #ffffff;
          border-radius: 19px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.3);
        }

        .modal-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          border-radius: 14px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
        }

        .modal-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 21px;
          font-weight: 950;
        }

        .modal-header p {
          margin: 6px 0 17px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .customer-details {
          padding: 12px;
          margin-bottom: 15px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 8px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 11px;
        }

        .detail-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .detail-row:first-child {
          padding-top: 0;
        }

        .detail-row span {
          color: #64748b;
          font-weight: 700;
        }

        .detail-row strong {
          color: #0f172a;
          text-align: right;
          font-weight: 900;
        }

        .form-field {
          margin-bottom: 13px;
        }

        .form-field label {
          display: block;
          margin-bottom: 6px;
          color: #334155;
          font-size: 11px;
          font-weight: 900;
        }

        .form-field input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          padding: 11px 12px;
          outline: none;
          font-size: 12px;
        }

        .form-field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-field input:disabled {
          background: #f8fafc;
          color: #94a3b8;
        }

        .modal-security {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin: 5px 0 15px;
          padding: 10px;
          border-radius: 9px;
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
          line-height: 1.45;
        }

        .modal-actions {
          display: grid;
          gap: 8px;
        }

        .continue-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 12px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.2);
        }

        .continue-button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .cancel-button {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 16px;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button-loading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          display: inline-block;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .gateway-note {
          margin-top: 11px;
          color: #94a3b8;
          font-size: 9px;
          text-align: center;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .buy-code-shell {
            padding: 20px 10px 35px;
          }

          .hero-description {
            font-size: 13px;
          }

          .hero-price {
            padding: 14px;
          }

          .payment-card-top {
            align-items: flex-start;
          }

          .recommended-pill {
            font-size: 8px;
          }

          .benefits {
            grid-template-columns: 1fr;
          }

          .benefit-item {
            min-height: auto;
            flex-direction: row;
            justify-content: flex-start;
            text-align: left;
            padding: 10px;
          }

          .support-card {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .support-content {
            min-width: calc(100% - 60px);
          }

          .support-button {
            width: 100%;
            margin-top: 2px;
          }

          .summary-row {
            align-items: flex-start;
          }

          .summary-row strong {
            max-width: 55%;
          }

          .detail-row {
            align-items: flex-start;
          }

          .detail-row strong {
            max-width: 58%;
            word-break: break-word;
          }
        }
      `}</style>
    </Layout>
  );
}
