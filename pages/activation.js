// pages/activation.js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { loadUser, saveUser, saveTx } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIVATION_FEE = 2500;
const PAYMENT_LINK = 'https://checkout.korapay.com/pay/2FQTeNCKpl96VId';
const PAYMENT_RETURN_PATH = '/activation-callback'; // Return path after payment

const ACTIVATION_REASONS = [
  { value: 'first-withdrawal', label: 'First Time Withdrawal' },
  { value: 'account-reactivation', label: 'Account Reactivation' },
  { value: 'security-verification', label: 'Security Verification Required' },
  { value: 'premium-features', label: 'Access Premium Features' },
  { value: 'account-upgrade', label: 'Account Upgrade' },
  { value: 'other', label: 'Other Reason' },
];

export default function Activation() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('first-withdrawal');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    // Check if already activated
    try {
      const activated = localStorage.getItem('gt_activated') === 'true';
      if (activated) {
        router.replace('/dashboard?activated=success');
        return;
      }
    } catch (e) {}

    setUser(currentUser);
    setFullName(currentUser.fullName || '');
    setPhone(currentUser.phone || '');
    setLoading(false);
  }, [router]);

  const validateForm = () => {
    const newErrors = {};

    if (!fullName || fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required (minimum 2 characters)';
    }

    if (!phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{11}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 11 digits (e.g., 08012345678)';
    }

    if (!reason) {
      newErrors.reason = 'Please select a reason for activation';
    }

    return newErrors;
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setPhone(digits.slice(0, 11));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  const handleNameChange = (e) => {
    setFullName(e.target.value);
    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: null }));
    }
  };

  const handlePaymentClick = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert(Object.values(validationErrors)[0]);
      return;
    }

    // Update user with activation info
    const updatedUser = {
      ...user,
      fullName: fullName.trim(),
      phone: phone,
    };
    saveUser(updatedUser);

    // Save activation request transaction (pending)
    try {
      saveTx({
        type: 'activation_request',
        amount: ACTIVATION_FEE,
        status: 'pending',
        meta: {
          reason: reason,
          initiatedAt: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error saving transaction:', e);
    }

    // Save activation details to localStorage for callback verification
    try {
      localStorage.setItem('gt_activation_pending', JSON.stringify({
        fullName: fullName.trim(),
        phone: phone,
        reason: reason,
        initiatedAt: Date.now(),
      }));
    } catch (e) {
      console.error('Error saving activation pending:', e);
    }

    setProcessing(true);

    // Redirect to payment link with return URL
    const returnUrl = new URL(PAYMENT_RETURN_PATH, window.location.origin).toString();
    const paymentUrl = new URL(PAYMENT_LINK);
    paymentUrl.searchParams.set('return_url', returnUrl);

    // Redirect to payment after a short delay
    setTimeout(() => {
      window.location.assign(paymentUrl.toString());
    }, 600);
  };

  if (loading) {
    return (
      <Layout>
        <div className="center" style={{ padding: 20 }}>
          <div className="card">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Account Activation - ElitePay Wallet">
      <style>{`
        .activation-shell {
          min-height: calc(100vh - 200px);
          display: grid;
          place-items: center;
          padding: 32px 16px;
          background: linear-gradient(135deg, rgba(15, 159, 110, 0.04) 0%, rgba(29, 127, 242, 0.04) 100%);
        }

        .activation-container {
          width: 100%;
          max-width: 600px;
        }

        .activation-card {
          background: #ffffff;
          border: 1px solid #dbe6f3;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 18px 45px rgba(16, 32, 51, 0.08);
        }

        .activation-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .activation-header h1 {
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 950;
          color: #102033;
        }

        .activation-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .fee-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(15, 159, 110, 0.10) 0%, rgba(29, 127, 242, 0.10) 100%);
          border: 1px solid rgba(15, 159, 110, 0.20);
          border-radius: 8px;
          color: #0f9f6e;
          font-weight: 850;
          font-size: 14px;
        }

        .fee-badge strong {
          color: #0f5f48;
          font-size: 18px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #102033;
          font-weight: 850;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          font-size: 14px;
          color: #102033;
          background: #ffffff;
          transition: all 200ms ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #0f9f6e;
          box-shadow: 0 0 0 3px rgba(15, 159, 110, 0.10);
          background: #f9fbfd;
        }

        .form-group.error input,
        .form-group.error select {
          border-color: #ef4444;
          background: #fff8f8;
        }

        .form-error {
          display: block;
          margin-top: 6px;
          color: #ef4444;
          font-size: 12px;
          font-weight: 700;
        }

        .activation-features {
          background: #f0f9f6;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
          border-left: 4px solid #0f9f6e;
        }

        .activation-features h3 {
          margin: 0 0 12px 0;
          color: #0f5f48;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .activation-features ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .activation-features li {
          position: relative;
          margin-bottom: 8px;
          color: #477569;
          font-size: 13px;
          padding-left: 18px;
        }

        .activation-features li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #0f9f6e;
          font-weight: 950;
        }

        .payment-info {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 14px;
          margin: 20px 0;
          color: #92400e;
          font-size: 13px;
          line-height: 1.6;
          border-left: 4px solid #f59e0b;
        }

        .payment-info strong {
          display: block;
          margin-bottom: 8px;
          color: #78350f;
          font-weight: 950;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }

        .btn-primary {
          flex: 1;
          padding: 14px 20px;
          background: linear-gradient(135deg, #0f9f6e 0%, #077a55 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-weight: 950;
          font-size: 14px;
          cursor: pointer;
          transition: all 200ms ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 159, 110, 0.30);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          flex: 1;
          padding: 14px 20px;
          background: #ffffff;
          color: #102033;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          font-weight: 850;
          font-size: 14px;
          cursor: pointer;
          transition: all 200ms ease;
        }

        .btn-secondary:hover {
          background: #f5fbf8;
          border-color: #0f9f6e;
        }

        .loader {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .activation-card {
            padding: 28px 20px;
          }

          .activation-header h1 {
            font-size: 22px;
          }

          .button-group {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="activation-shell">
        <div className="activation-container">
          <div className="activation-card">
            <div className="activation-header">
              <h1>🔐 Account Activation</h1>
              <p>
                Activate your ElitePay account to unlock withdrawals and premium features.
                Complete the activation to securely manage your wallet.
              </p>
              <div className="fee-badge">
                💰 Activation Fee: <strong>₦{ACTIVATION_FEE.toLocaleString()}</strong>
              </div>
            </div>

            <form onSubmit={handlePaymentClick}>
              {/* Full Name */}
              <div className={`form-group ${errors.fullName ? 'error' : ''}`}>
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={handleNameChange}
                  placeholder="Enter your full name"
                  disabled={processing}
                  required
                />
                {errors.fullName && <span className="form-error">{errors.fullName}</span>}
              </div>

              {/* Phone Number */}
              <div className={`form-group ${errors.phone ? 'error' : ''}`}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="08012345678"
                  disabled={processing}
                  required
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>

              {/* Reason for Activation */}
              <div className={`form-group ${errors.reason ? 'error' : ''}`}>
                <label htmlFor="reason">Reason for Activation</label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (errors.reason) setErrors((prev) => ({ ...prev, reason: null }));
                  }}
                  disabled={processing}
                  required
                >
                  {ACTIVATION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.reason && <span className="form-error">{errors.reason}</span>}
              </div>

              {/* Features */}
              <div className="activation-features">
                <h3>✓ You'll Get:</h3>
                <ul>
                  <li>Unlimited withdrawal requests</li>
                  <li>24/7 account access</li>
                  <li>Priority support</li>
                  <li>Enhanced security features</li>
                </ul>
              </div>

              {/* Payment Info */}
              <div className="payment-info">
                <strong>📌 Important:</strong>
                You will be redirected to a secure payment page. Complete your payment to activate your account. Only accounts with successful payments will be activated.
              </div>

              {/* Buttons */}
              <div className="button-group">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => router.push('/dashboard')}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="loader"></span> Processing...
                    </>
                  ) : (
                    `💳 Proceed to Payment`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}