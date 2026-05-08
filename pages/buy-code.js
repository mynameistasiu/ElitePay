// pages/buy-code.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/Layout";
import { loadUser, saveTx } from "../utils/storage";

const CODE_PRICE = 5700;
const WA = "+2348133861975";
const ONLINE_PAYMENT_URL = "https://checkout.korapay.com/pay/elitepayng";
const ONLINE_RETURN_PATH = "/code?payment=online";

function PurchaseLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden role="img">
      <path d="M3 6h2l1 9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-7H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1" fill="currentColor" />
      <circle cx="18" cy="20" r="1" fill="currentColor" />
      <path d="M16 10a2 2 0 1 0-4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OnlinePaymentLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden role="img">
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16.5 15.5 18 17l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BuyCode() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState("merchant");
  const [showModal, setShowModal] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);

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

  const normalizePhone = (v) => {
    let x = String(v || "").replace(/\s+/g, "");
    if (x.startsWith("+234")) x = "0" + x.slice(4);
    return x.replace(/[^0-9]/g, "").slice(0, 11);
  };

  const handleBuyClick = (e) => {
    e.preventDefault();
    setShowModal(true);
    buyButtonRef.current = e.currentTarget;
  };

  useEffect(() => {
    if (!showModal) {
      if (buyButtonRef.current) buyButtonRef.current.focus();
      return;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      if (nameInputRef.current) nameInputRef.current.focus();
    }, 60);

    const onKey = (ev) => {
      if (ev.key === "Escape") {
        setShowModal(false);
        return;
      }
      if (ev.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (ev.shiftKey) {
          if (document.activeElement === first) {
            ev.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            ev.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  const handleProceed = () => {
    const nameToUse = confirmName || user?.fullName || "";
    const phoneToUse = phone || user?.phone || "";

    if (!nameToUse) {
      alert("Your account name was not found. Please update your profile first.");
      return;
    }
    if (!phoneToUse) {
      alert("Your account phone number was not found. Please update your profile first.");
      return;
    }
    const normalized = normalizePhone(phoneToUse);
    setProcessing(true);
    setTimeout(() => {
      const q = `?name=${encodeURIComponent(nameToUse)}&phone=${encodeURIComponent(normalized)}`;
      router.push(`/checkout${q}`);
    }, 450);
  };

  const openWhatsApp = () => window.open(`https://wa.me/${WA.replace("+", "")}`, "_blank", "noopener");
  const openOnlinePayment = () => {
    const redirectUrl = new URL(ONLINE_RETURN_PATH, window.location.origin).toString();
    const paymentUrl = new URL(ONLINE_PAYMENT_URL);
    paymentUrl.searchParams.set("redirect_url", redirectUrl);

    try {
      saveTx({
        type: "buy_code",
        amount: CODE_PRICE,
        status: "pending",
        meta: {
          gateway: "korapay",
          redirect_url: redirectUrl,
        },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Continue to payment even if local transaction history cannot be updated.
    }

    window.location.assign(paymentUrl.toString());
  };

  return (
    <Layout>
      <div className="buy-code-shell">
        <div className="hero-section">
          <h1>Buy Withdrawal Code</h1>
          <p>Purchase an activation code to unlock withdrawals and manage your ElitePay wallet with full access.</p>
          <div className="code-price-box">
            <span>Code Price:</span>
            <strong>₦{CODE_PRICE.toLocaleString()}</strong>
          </div>
        </div>

        <div className="payment-grid">
          <motion.div
            className="card"
            onMouseEnter={() => setSelected("online")}
            onFocus={() => setSelected("online")}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="card-header">
              <div className="card-icon card-icon-online">
                <OnlinePaymentLogo size={28} />
              </div>
              <div>
                <h2 className="card-title">Online Payment</h2>
                <div className="card-subtitle">Secure card, bank, or transfer checkout</div>
              </div>
            </div>

            <div className="card-body">
              <p className="card-note">
                Use the online checkout to pay through Flutterwave. After payment, return to ElitePay to continue and receive your withdrawal code.
              </p>

              <div className="price-display">
                <span className="price-label">Amount to Pay</span>
                <span className="price-value">₦{CODE_PRICE.toLocaleString()}</span>
              </div>

              <div className="online-features" aria-label="Online payment features">
                <span>Secure checkout</span>
                <span>Instant confirmation</span>
                <span>Card or bank transfer</span>
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={openOnlinePayment}
                >
                  Pay Online
                </button>
                <button className="btn btn-secondary" onClick={openWhatsApp}>
                  Contact Support
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card"
            onMouseEnter={() => setSelected("merchant")}
            onFocus={() => setSelected("merchant")}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="card-header">
              <div className="card-icon">
                <PurchaseLogo size={28} />
              </div>
              <div>
                <h2 className="card-title">Pay Vendor</h2>
                <div className="card-subtitle">Manual vendor payment via bank transfer</div>
              </div>
            </div>

            <div className="card-body">
              <p className="card-note">Click <strong>Buy Now</strong> to proceed with payment confirmation. You'll be guided to complete the bank transfer and receive your activation code instantly.</p>

              <div className="price-display">
                <span className="price-label">Amount to Pay</span>
                <span className="price-value">₦{CODE_PRICE.toLocaleString()}</span>
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleBuyClick}
                >
                  Buy Now
                </button>
                <button className="btn btn-secondary" onClick={openWhatsApp}>
                  Contact Support
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="help-section">
          <p className="help-text">
            Need assistance?{" "}
            <a 
              href={`https://wa.me/${WA.replace("+", "")}`} 
              target="_blank" 
              rel="noreferrer" 
              className="help-link"
            >
              Chat with us on WhatsApp
            </a>
          </p>
        </div>

        <AnimatePresence>
          {showModal && (
            <motion.div 
              className="overlay" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                className="modal"
                initial={{ y: 20, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="confirm-title">Confirm Payment Details</h3>
                <p>We'll use your ElitePay account information to process this purchase.</p>

                <div className="form-field">
                  <label>Full Name</label>
                  <input ref={nameInputRef} value={confirmName} readOnly aria-readonly="true" />
                </div>

                <div className="form-field">
                  <label>Phone Number</label>
                  <input value={phone} readOnly aria-readonly="true" />
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleProceed} 
                    disabled={!confirmName || !phone || processing}
                  >
                    {processing ? "Processing..." : "Proceed to Payment"}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
