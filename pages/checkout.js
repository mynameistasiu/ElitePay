import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { saveTx } from '../utils/storage';

const CODE_PRICE = 7000;
const DISPLAY_PRICE = 7000;
const ACCOUNT_NUMBER = '2082683908';
const ACCOUNT_NAME = 'Abdulrahim Usman';
const BANK_NAME = 'Kuda Bank';
const WA = '+2347072369400';

function CopyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KudaMark() {
  return (
    <div className="kuda-mark" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" stroke="rgba(255,255,255,0.28)" />
        <path
          d="M8 7.5V20.5M8 14L18.5 7.5M8 14L19 20.5"
          stroke="#ffffff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function InfoChip({ children }) {
  return <span className="info-chip">{children}</span>;
}

export default function Checkout() {
  const router = useRouter();
  const { name: qName, phone: qPhone } = router.query;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countdown, setCountdown] = useState(10 * 60);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof qName === 'string') setName(qName);
    if (typeof qPhone === 'string') setPhone(qPhone);
  }, [qName, qPhone]);

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

    return () => clearInterval(timerRef.current);
  }, []);

  const copyText = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1300);
    } catch (error) {
      prompt(`Copy ${label}:`, value);
    }
  };

  const buildWhatsAppUrl = () => {
    const message = encodeURIComponent(
      `Hello, I have made payment for ElitePay withdrawal code.\n` +
        `Name: ${name || 'Not provided'}\n` +
        `Phone: ${phone || 'Not provided'}\n` +
        `Amount: NGN ${CODE_PRICE.toLocaleString()}\n` +
        `Account: ${ACCOUNT_NUMBER}\n` +
        `Bank: ${BANK_NAME}`
    );

    return `https://wa.me/${WA.replace('+', '')}?text=${message}`;
  };

  const confirmPayment = () => {
    if (countdown === 0) {
      alert('Payment time expired. Please restart checkout.');
      return;
    }

    setConfirming(true);

    setTimeout(() => {
      saveTx({
        type: 'buy_code',
        amount: CODE_PRICE,
        status: 'pending',
        meta: {
          name,
          phone,
          bank: BANK_NAME,
          account: ACCOUNT_NUMBER,
        },
        created_at: new Date().toISOString(),
      });

      setConfirming(false);
      setPaymentStatus('awaiting');

      window.location.href = buildWhatsAppUrl();
    }, 900);
  };

  const contactVendor = () => {
    window.location.href = buildWhatsAppUrl();
  };

  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  return (
    <Layout title="Checkout - ElitePay Wallet">
      <style>{`
        .checkout-shell {
          min-height: calc(100vh - 170px);
          display: flex;
          justify-content: center;
          padding: 12px 0 24px;
        }

        .pay-screen {
          width: min(430px, 100%);
          background: #f8fafc;
          border: 1px solid #e7edf4;
          border-radius: 8px;
          padding: 12px 16px 18px;
          box-shadow: 0 24px 70px rgba(16, 32, 51, 0.12);
        }

        .checkout-logo {
          width: 74px;
          height: 74px;
          object-fit: contain;
          display: block;
          margin: 0 auto 14px;
        }

        .bank-illustration {
          display: flex;
          justify-content: center;
          margin-bottom: 10px;
        }

        .pay-title {
          text-align: center;
          color: #0b1220;
          font-size: 22px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.02em;
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
          color: #6b7280;
          cursor: pointer;
          font-size: 13px;
          font-weight: 750;
        }

        .info-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0 14px;
        }

        .info-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #eef4ff;
          color: #234f9d;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .instruction {
          background: #fde7d1;
          color: #7a4a1f;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.45;
          text-align: center;
          margin-bottom: 16px;
        }

        .instruction strong {
          color: #9a5b17;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .account-card {
          overflow: hidden;
          background: #ffffff;
          border-radius: 10px;
          box-shadow: 0 16px 38px rgba(16, 32, 51, 0.12);
          border: 1px solid rgba(219, 230, 243, 0.8);
          text-align: center;
        }

        .account-main {
          padding: 22px 18px 18px;
        }

        .bank-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .kuda-mark {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b1c7a, #6f3cff);
          box-shadow: 0 10px 20px rgba(111, 60, 255, 0.2);
          flex: 0 0 auto;
        }

        .bank-name {
          color: #0b1220;
          font-size: 16px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .bank-label {
          display: block;
          color: #6b7280;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 5px;
        }

        .account-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #1677f2;
          font-size: 28px;
          font-weight: 950;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0;
          letter-spacing: 0.02em;
          line-height: 1.1;
        }

        .account-name {
          margin: 8px 0 0;
          color: #174473;
          font-size: 17px;
          font-weight: 850;
        }

        .warning-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #eaf4ff;
          color: #2b5d89;
          padding: 11px 10px;
          font-size: 12px;
          font-weight: 760;
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
        }

        .progress-wrap {
          width: 118px;
          height: 4px;
          border-radius: 999px;
          background: #d9e2ec;
          margin: 22px auto 14px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          width: 42%;
          border-radius: inherit;
          background: #1677f2;
        }

        .timer {
          text-align: center;
          color: ${countdown <= 60 ? '#ef4444' : '#64748b'};
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .confirm-note {
          text-align: center;
          color: #a0a9b5;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .footer-actions {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          align-items: center;
          border-top: 1px solid #edf2f7;
          padding-top: 13px;
          margin-top: 14px;
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
          font-size: 15px;
          font-weight: 900;
          padding: 8px;
        }

        .cancel {
          color: #ef4444;
        }

        .help {
          color: #111827;
        }

        .confirm-button {
          width: 100%;
          margin-top: 12px;
        }

        .copied {
          min-height: 18px;
          color: #0f9f6e;
          text-align: center;
          font-size: 12px;
          font-weight: 850;
          margin-top: 8px;
        }

        .awaiting-box {
          margin-top: 12px;
          padding: 12px;
          border-radius: 8px;
          background: #effaf5;
          border: 1px solid rgba(15, 159, 110, 0.24);
          color: #0f5138;
          text-align: center;
        }

        .awaiting-title {
          font-size: 15px;
          font-weight: 900;
          margin-bottom: 4px;
        }

        .vendor-button {
          width: 100%;
          margin-top: 10px;
          background: linear-gradient(135deg, #111827, #334155);
          box-shadow: 0 12px 24px rgba(17, 24, 39, 0.18);
        }
      `}</style>

      <div className="checkout-shell">
        <section className="pay-screen" aria-label="Bank transfer checkout">
          <img className="checkout-logo" src="/elitepay-logo.png" alt="ElitePay" />

          <div className="bank-illustration">
            <svg width="84" height="64" viewBox="0 0 84 64" fill="none" aria-hidden="true">
              <path d="M42 4 14 18v6h56v-6L42 4Z" fill="#cbd5e1" />
              <path d="M20 28h8v22h-8V28Zm18 0h8v22h-8V28Zm18 0h8v22h-8V28Z" fill="#94a3b8" />
              <path d="M14 52h56v7H14v-7Z" fill="#cbd5e1" />
              <circle cx="24" cy="49" r="10" fill="#d9e2ec" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="60" cy="49" r="10" fill="#d9e2ec" stroke="#94a3b8" strokeWidth="2" />
            </svg>
          </div>

          <h1 className="pay-title">Pay NGN {DISPLAY_PRICE.toLocaleString()}</h1>

          <div className="copy-row">
            <button className="copy-amount" onClick={() => copyText('amount', String(DISPLAY_PRICE))}>
              <CopyIcon /> Copy amount
            </button>
          </div>

          <div className="info-row">
            <InfoChip>Instant transfer</InfoChip>
            <InfoChip>Secure checkout</InfoChip>
            <InfoChip>Payment verification</InfoChip>
          </div>

          <div className="instruction">
            Transfer exactly <strong>NGN {CODE_PRICE.toLocaleString()}</strong> to the bank account below.
          </div>

          <div className="account-card">
            <div className="account-main">
              <div className="bank-row">
                <KudaMark />
                <div style={{ textAlign: 'left' }}>
                  <span className="bank-label">Bank name</span>
                  <div className="bank-name">{BANK_NAME}</div>
                </div>
              </div>

              <button className="account-number" onClick={() => copyText('account number', ACCOUNT_NUMBER)}>
                {ACCOUNT_NUMBER} <CopyIcon size={18} />
              </button>

              <div className="account-name">{ACCOUNT_NAME}</div>
            </div>

            <div className="warning-footer">
              <span className="minus">-</span>
              <span>Do not save or reuse this account number.</span>
            </div>
          </div>

          <div className="copied">{copied ? `${copied} copied` : ''}</div>

          <div className="progress-wrap">
            <div className="progress-bar" />
          </div>

          <div className="timer">Payment window: {minutes}:{seconds}</div>
          <div className="confirm-note">You will get a confirmation once we receive your payment.</div>

          <button className="btn confirm-button" onClick={confirmPayment} disabled={confirming}>
            {confirming ? 'Processing payment check...' : 'I have made payment'}
          </button>

          {paymentStatus === 'awaiting' && (
            <div className="awaiting-box" role="status">
              <div className="awaiting-title">Redirecting to WhatsApp...</div>
              <div className="small muted">Your payment details are ready for confirmation.</div>
              <button className="btn vendor-button" onClick={contactVendor}>
                Open WhatsApp again
              </button>
            </div>
          )}

          <div className="footer-actions">
            <button className="text-action cancel" onClick={() => router.push('/buy-code')}>
              Cancel
            </button>
            <span className="divider" />
            <button className="text-action help" onClick={() => window.open(`https://wa.me/${WA.replace('+', '')}`, '_blank', 'noopener')}>
              Help?
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}