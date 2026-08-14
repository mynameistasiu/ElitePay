import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { saveUser, saveBalance, saveTx, loadUser } from '../utils/storage';

const BANKS = [
  'Access Bank',
  'ALAT by Wema',
  'Ecobank Nigeria',
  'FCMB',
  'Fidelity Bank',
  'First Bank',
  'GTBank',
  'Kuda Bank',
  'Moniepoint MFB',
  'Opay',
  'PalmPay',
  'Polaris Bank',
  'Stanbic IBTC',
  'Sterling Bank',
  'UBA',
  'Union Bank',
  'Wema Bank',
  'Zenith Bank',
];

const STEPS = [
  {
    number: 1,
    title: 'Personal',
    description: 'Basic account information',
  },
  {
    number: 2,
    title: 'Security',
    description: 'Protect your wallet',
  },
  {
    number: 3,
    title: 'Bank Account',
    description: 'Optional withdrawal setup',
  },
  {
    number: 4,
    title: 'Review',
    description: 'Confirm your information',
  },
];

export default function Register() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [accept, setAccept] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    'Preparing your wallet...'
  );

  const [errors, setErrors] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    const existingUser = loadUser();

    if (existingUser) {
      router.push('/dashboard');
    }
  }, [router]);

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        label: 'Weak',
        width: '25%',
        className: 'weak',
      };
    }

    if (score <= 3) {
      return {
        label: 'Medium',
        width: '60%',
        className: 'medium',
      };
    }

    return {
      label: 'Strong',
      width: '100%',
      className: 'strong',
    };
  }, [password]);

  const completedFields = [
    name.trim().length >= 2,
    /^\d{11}$/.test(phone),
    password.length >= 8,
    password === confirmPassword && password.length >= 8,
    bank && /^\d{10}$/.test(accountNumber) && accountName.trim().length >= 2,
  ].filter(Boolean).length;

  const profileProgress = Math.round((completedFields / 5) * 100);

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateStep = () => {
    const nextErrors = {};

    if (step === 1) {
      if (!name.trim() || name.trim().length < 2) {
        nextErrors.name = 'Please enter your full name.';
      }

      if (!phone) {
        nextErrors.phone = 'Phone number is required.';
      } else if (!/^\d{11}$/.test(phone)) {
        nextErrors.phone =
          'Enter a valid 11-digit Nigerian phone number.';
      }
    }

    if (step === 2) {
      if (!password) {
        nextErrors.password = 'Create a password for your wallet.';
      } else if (password.length < 8) {
        nextErrors.password =
          'Password must contain at least 8 characters.';
      }

      if (!confirmPassword) {
        nextErrors.confirmPassword =
          'Please confirm your password.';
      } else if (password !== confirmPassword) {
        nextErrors.confirmPassword =
          'Passwords do not match.';
      }
    }

    if (step === 3) {
      const hasAnyBankDetail =
        bank || accountNumber || accountName;

      if (hasAnyBankDetail) {
        if (!bank) {
          nextErrors.bank = 'Select your bank.';
        }

        if (!/^\d{10}$/.test(accountNumber)) {
          nextErrors.accountNumber =
            'Account number must contain 10 digits.';
        }

        if (!accountName.trim()) {
          nextErrors.accountName =
            'Enter the name on the bank account.';
        }
      }
    }

    if (step === 4) {
      if (!accept) {
        nextErrors.accept =
          'Please accept the Terms and Privacy Policy.';
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;

    setStep((current) => Math.min(current + 1, 4));
  };

  const previousStep = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  };

  const createAccount = () => {
    if (!validateStep()) return;

    setLoading(true);
    setLoadingMessage('Creating your ElitePay wallet...');

    setTimeout(() => {
      setLoadingMessage('Setting up your wallet security...');
    }, 700);

    setTimeout(() => {
      setLoadingMessage('Preparing your dashboard...');
    }, 1400);

    setTimeout(() => {
      const savedAccount =
        bank && accountNumber && accountName
          ? {
              id: `acct-${Date.now()}`,
              label: 'Primary withdrawal account',
              bank,
              accountNumber,
              accountName: accountName.trim(),
              created_at: new Date().toISOString(),
            }
          : null;

      const user = {
        fullName: name.trim(),
        phone,
        password,
        plan: 'Pulse Miner',

        withdrawalAccounts: savedAccount
          ? [savedAccount]
          : [],

        defaultWithdrawalAccountId:
          savedAccount?.id || '',

        created_at: new Date().toISOString(),

        preferences: {
          notifications: true,
          transactionAlerts: true,
        },
      };

      saveUser(user);

      // New wallet starts at zero.
      saveBalance(0);

      saveTx([]);

      setLoading(false);
      setCreated(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2200);
    }, 2100);
  };

  if (created) {
    return (
      <Layout title="Wallet Created - ElitePay">
        <style>{`
          .success-page {
            min-height: calc(100vh - 180px);
            display: grid;
            place-items: center;
            padding: 30px 16px;
          }

          .success-card {
            width: min(520px, 100%);
            text-align: center;
            padding: 40px 28px;
          }

          .success-icon {
            width: 92px;
            height: 92px;
            margin: 0 auto 20px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            color: white;
            font-size: 42px;
            font-weight: 950;
            background: linear-gradient(
              135deg,
              #0f9f6e,
              #19b9a7
            );
            box-shadow:
              0 18px 45px rgba(15, 159, 110, .25);
            animation: pop .55s ease both;
          }

          .success-card h1 {
            margin: 0;
            color: #102033;
            font-size: 30px;
            font-weight: 950;
          }

          .success-card p {
            color: #64748b;
            line-height: 1.7;
          }

          .success-badge {
            margin: 20px auto;
            padding: 12px 16px;
            border-radius: 12px;
            background: #e9f8f2;
            color: #077a55;
            font-size: 13px;
            font-weight: 850;
          }

          @keyframes pop {
            0% {
              transform: scale(.5);
              opacity: 0;
            }
            70% {
              transform: scale(1.08);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>

        <div className="success-page">
          <div className="card success-card">
            <div className="success-icon">✓</div>

            <h1>Wallet Created</h1>

            <p>
              Welcome to ElitePay,{' '}
              <strong>{name}</strong>.
              Your wallet profile has been created successfully.
            </p>

            <div className="success-badge">
              Your dashboard is being prepared...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Create ElitePay Wallet">
      <style>{`
        .register-page {
          min-height: calc(100vh - 170px);
          padding: 20px 0 40px;
        }

        .register-container {
          width: min(1080px, 100%);
          margin: 0 auto;
        }

        .register-card {
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          overflow: hidden;
          padding: 0;
          min-height: 690px;
        }

        /* LEFT */

        .register-sidebar {
          position: relative;
          overflow: hidden;
          padding: 30px;
          color: white;
          background:
            radial-gradient(
              circle at 15% 10%,
              rgba(25,185,167,.28),
              transparent 35%
            ),
            radial-gradient(
              circle at 90% 80%,
              rgba(29,127,242,.20),
              transparent 35%
            ),
            linear-gradient(
              145deg,
              #102033,
              #0d4e3d
            );
        }

        .register-sidebar::before {
          content: "";
          position: absolute;
          width: 240px;
          height: 240px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 50%;
          top: 90px;
          right: -110px;
        }

        .register-sidebar::after {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 50%;
          bottom: 60px;
          left: -90px;
        }

        .brand-logo {
          position: relative;
          z-index: 1;
          width: 150px;
          margin-bottom: 28px;
          filter: drop-shadow(
            0 15px 25px rgba(0,0,0,.28)
          );
        }

        .sidebar-title {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 32px;
          line-height: 1.05;
          font-weight: 950;
        }

        .sidebar-copy {
          position: relative;
          z-index: 1;
          margin: 12px 0 28px;
          color: rgba(255,255,255,.72);
          line-height: 1.65;
          font-size: 14px;
        }

        .wallet-preview {
          position: relative;
          z-index: 1;
          padding: 18px;
          border-radius: 18px;
          background: rgba(255,255,255,.09);
          border: 1px solid rgba(255,255,255,.14);
          backdrop-filter: blur(14px);
        }

        .wallet-preview-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 20px;
        }

        .wallet-label {
          color: rgba(255,255,255,.62);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(25,185,167,.15);
          color: #8ff3dc;
          font-size: 10px;
          font-weight: 900;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3ee4b5;
          box-shadow: 0 0 10px #3ee4b5;
        }

        .preview-balance {
          font-size: 29px;
          font-weight: 950;
          margin-bottom: 18px;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .preview-item {
          padding: 10px;
          border-radius: 11px;
          background: rgba(255,255,255,.07);
        }

        .preview-item small {
          display: block;
          color: rgba(255,255,255,.52);
          font-size: 10px;
        }

        .preview-item strong {
          display: block;
          margin-top: 4px;
          font-size: 13px;
        }

        .sidebar-features {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 10px;
          margin-top: 22px;
        }

        .sidebar-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,.78);
          font-size: 12px;
          font-weight: 750;
        }

        .sidebar-feature-icon {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 9px;
          background: rgba(255,255,255,.09);
          color: #8ff3dc;
        }

        /* RIGHT */

        .register-content {
          padding: 34px;
          background: #fff;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 22px;
        }

        .content-kicker {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: #e9f8f2;
          color: #077a55;
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .content-title {
          margin: 0;
          color: #102033;
          font-size: 30px;
          font-weight: 950;
        }

        .content-description {
          max-width: 520px;
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .completion-box {
          min-width: 110px;
          text-align: right;
        }

        .completion-value {
          color: #077a55;
          font-size: 20px;
          font-weight: 950;
        }

        .completion-label {
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
        }

        .completion-track {
          width: 110px;
          height: 6px;
          margin-top: 6px;
          overflow: hidden;
          border-radius: 99px;
          background: #e5edf5;
        }

        .completion-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #0f9f6e,
            #19b9a7
          );
          transition: width .3s ease;
        }

        /* STEPPER */

        .stepper {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-bottom: 28px;
        }

        .stepper-item {
          position: relative;
          text-align: center;
        }

        .stepper-item:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 17px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: #e5edf5;
          z-index: 0;
        }

        .stepper-item.active:not(:last-child)::after {
          background: #bcebdd;
        }

        .step-circle {
          position: relative;
          z-index: 1;
          width: 34px;
          height: 34px;
          margin: 0 auto 7px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 2px solid #dbe6f3;
          background: white;
          color: #64748b;
          font-size: 12px;
          font-weight: 950;
        }

        .stepper-item.active .step-circle {
          color: white;
          border-color: #0f9f6e;
          background: #0f9f6e;
          box-shadow: 0 0 0 5px #e9f8f2;
        }

        .stepper-item.completed .step-circle {
          color: white;
          border-color: #0f9f6e;
          background: #0f9f6e;
        }

        .step-name {
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
        }

        .stepper-item.active .step-name {
          color: #077a55;
        }

        /* FORM */

        .form-section {
          animation: slideUp .3s ease both;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-title {
          margin: 0;
          color: #102033;
          font-size: 20px;
          font-weight: 950;
        }

        .section-description {
          margin: 5px 0 20px;
          color: #64748b;
          font-size: 13px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .field {
          margin-bottom: 14px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #334155;
          font-size: 12px;
          font-weight: 850;
        }

        .field-error {
          margin-top: 5px;
          color: #b42318;
          font-size: 11px;
          font-weight: 800;
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap .input {
          padding-right: 45px;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 11px;
          font-weight: 850;
        }

        .strength {
          margin-top: 7px;
        }

        .strength-top {
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
        }

        .strength-track {
          height: 5px;
          margin-top: 5px;
          overflow: hidden;
          border-radius: 99px;
          background: #e5edf5;
        }

        .strength-fill {
          height: 100%;
          border-radius: inherit;
          transition: width .3s ease;
        }

        .strength-fill.weak {
          background: #ef4444;
        }

        .strength-fill.medium {
          background: #f59e0b;
        }

        .strength-fill.strong {
          background: #0f9f6e;
        }

        .bank-box {
          padding: 16px;
          border: 1px solid #dbe6f3;
          border-radius: 14px;
          background: #f8fafc;
        }

        .bank-box-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 5px;
        }

        .optional {
          padding: 4px 8px;
          border-radius: 999px;
          background: #e9f8f2;
          color: #077a55;
          font-size: 9px;
          font-weight: 900;
        }

        .bank-note {
          margin-bottom: 14px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .info-box {
          margin-top: 14px;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid #dbe6f3;
          background: #f8fafc;
        }

        .info-button {
          border: 0;
          background: transparent;
          color: #077a55;
          font-weight: 900;
          cursor: pointer;
          padding: 0;
        }

        .info-content {
          margin-top: 9px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        /* REVIEW */

        .review-card {
          display: grid;
          gap: 10px;
          margin-bottom: 14px;
        }

        .review-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid #edf3f8;
        }

        .review-row:last-child {
          border-bottom: 0;
        }

        .review-label {
          color: #64748b;
          font-size: 12px;
        }

        .review-value {
          color: #102033;
          font-size: 13px;
          font-weight: 900;
          text-align: right;
        }

        .terms {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 13px;
          background: #f8fafc;
          border: 1px solid #dbe6f3;
        }

        .terms input {
          width: 17px;
          height: 17px;
          margin-top: 2px;
          accent-color: #0f9f6e;
        }

        .terms-text {
          color: #64748b;
          font-size: 12px;
          line-height: 1.55;
        }

        /* ACTIONS */

        .actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #edf3f8;
        }

        .actions-right {
          display: flex;
          gap: 10px;
        }

        .login-link {
          margin-top: 20px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }

        .login-link button {
          border: 0;
          padding: 0;
          background: transparent;
          color: #077a55;
          font-weight: 900;
          cursor: pointer;
        }

        /* SECURITY */

        .security-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 20px;
        }

        .security-item {
          padding: 10px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #edf3f8;
          text-align: center;
        }

        .security-icon {
          font-size: 17px;
          margin-bottom: 4px;
        }

        .security-item strong {
          display: block;
          color: #334155;
          font-size: 10px;
        }

        .security-item span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 9px;
        }

        /* LOADING */

        .loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(16,32,51,.52);
          backdrop-filter: blur(10px);
        }

        .loading-card {
          width: min(400px, 100%);
          padding: 30px;
          text-align: center;
          border-radius: 20px;
          background: white;
          box-shadow: 0 30px 90px rgba(16,32,51,.25);
        }

        .loading-orbit {
          width: 74px;
          height: 74px;
          margin: 0 auto 20px;
          border-radius: 50%;
          border: 4px solid #e5f4ee;
          border-top-color: #0f9f6e;
          animation: spin 1s linear infinite;
        }

        .loading-card h3 {
          margin: 0;
          color: #102033;
          font-size: 18px;
          font-weight: 950;
        }

        .loading-card p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 850px) {
          .register-card {
            grid-template-columns: 1fr;
          }

          .register-sidebar {
            min-height: auto;
          }

          .wallet-preview {
            max-width: 500px;
          }
        }

        @media (max-width: 600px) {
          .register-content {
            padding: 22px 16px;
          }

          .content-header {
            flex-direction: column;
          }

          .completion-box {
            text-align: left;
          }

          .completion-track {
            width: 100%;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .field.full {
            grid-column: auto;
          }

          .step-name {
            display: none;
          }

          .stepper {
            margin-bottom: 22px;
          }

          .actions {
            flex-direction: column-reverse;
          }

          .actions-right {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .security-row {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .sidebar-title {
            font-size: 27px;
          }

          .register-page {
            padding-top: 8px;
          }
        }
      `}</style>

      <div className="register-page">
        <div className="register-container">
          <section className="card register-card">

            {/* SIDEBAR */}
            <aside className="register-sidebar">

              <img
                className="brand-logo"
                src="/elitepay-logo.png"
                alt="ElitePay"
              />

              <h1 className="sidebar-title">
                Your wallet.
                <br />
                Your control.
              </h1>

              <p className="sidebar-copy">
                Create your ElitePay profile and manage your wallet,
                rewards, transactions and withdrawal preferences
                from one place.
              </p>
              
              <div className="sidebar-features">

                <div className="sidebar-feature">
                  <span className="sidebar-feature-icon">
                    ✓
                  </span>
                  Wallet activity tracking
                </div>

                <div className="sidebar-feature">
                  <span className="sidebar-feature-icon">
                    ✓
                  </span>
                  Saved withdrawal account
                </div>

                <div className="sidebar-feature">
                  <span className="sidebar-feature-icon">
                    ✓
                  </span>
                  Transaction history
                </div>

                <div className="sidebar-feature">
                  <span className="sidebar-feature-icon">
                    ✓
                  </span>
                  Account preferences
                </div>

              </div>

            </aside>

            {/* CONTENT */}
            <main className="register-content">

              <div className="content-header">

                <div>
                  <span className="content-kicker">
                    CREATE WALLET
                  </span>

                  <h2 className="content-title">
                    Welcome to ElitePay
                  </h2>

                  <p className="content-description">
                    Set up your account in a few simple steps.
                    You can update your bank details and
                    preferences later from your wallet.
                  </p>
                </div>

                <div className="completion-box">

                  <div className="completion-value">
                    {profileProgress}%
                  </div>

                  <div className="completion-label">
                    PROFILE READY
                  </div>

                  <div className="completion-track">
                    <div
                      className="completion-fill"
                      style={{
                        width: `${profileProgress}%`,
                      }}
                    />
                  </div>

                </div>

              </div>

              {/* STEPPER */}

              <div className="stepper">

                {STEPS.map((item) => {

                  const completed = step > item.number;
                  const active = step === item.number;

                  return (
                    <div
                      key={item.number}
                      className={`stepper-item ${
                        active ? 'active' : ''
                      } ${
                        completed ? 'completed' : ''
                      }`}
                    >

                      <div className="step-circle">
                        {completed
                          ? '✓'
                          : item.number}
                      </div>

                      <div className="step-name">
                        {item.title}
                      </div>

                    </div>
                  );
                })}

              </div>

              {/* STEP 1 */}

              {step === 1 && (
                <div className="form-section">

                  <h3 className="section-title">
                    Personal information
                  </h3>

                  <p className="section-description">
                    Tell us the basic information needed
                    to create your wallet profile.
                  </p>

                  <div className="form-grid">

                    <div className="field full">

                      <label
                        className="field-label"
                        htmlFor="register-name"
                      >
                        Full name
                      </label>

                      <input
                        id="register-name"
                        className="input"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearError('name');
                        }}
                        disabled={loading}
                        autoComplete="name"
                      />

                      {errors.name && (
                        <div className="field-error">
                          {errors.name}
                        </div>
                      )}

                    </div>

                    <div className="field full">

                      <label
                        className="field-label"
                        htmlFor="register-phone"
                      >
                        Phone number
                      </label>

                      <input
                        id="register-phone"
                        className="input"
                        placeholder="08031234567"
                        value={phone}
                        maxLength={11}
                        inputMode="numeric"
                        autoComplete="tel"
                        onChange={(e) => {
                          const digits =
                            e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 11);

                          setPhone(digits);
                          clearError('phone');
                        }}
                        disabled={loading}
                      />

                      {errors.phone && (
                        <div className="field-error">
                          {errors.phone}
                        </div>
                      )}

                    </div>

                  </div>

                  <div className="info-box">

                    <button
                      className="info-button"
                      type="button"
                      onClick={() =>
                        setShowInfo((value) => !value)
                      }
                    >
                      Why do we need this information?
                    </button>

                    {showInfo && (
                      <div className="info-content">
                        Your name and phone number are used
                        to identify your wallet profile and
                        connect your account activity with
                        your ElitePay session.
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* STEP 2 */}

              {step === 2 && (
                <div className="form-section">

                  <h3 className="section-title">
                    Secure your wallet
                  </h3>

                  <p className="section-description">
                    Create a strong password that you can
                    use to protect access to your account.
                  </p>

                  <div className="field">

                    <label
                      className="field-label"
                      htmlFor="password"
                    >
                      Password
                    </label>

                    <div className="input-wrap">

                      <input
                        id="password"
                        className="input"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearError('password');
                        }}
                        disabled={loading}
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (value) => !value
                          )
                        }
                      >
                        {showPassword
                          ? 'Hide'
                          : 'Show'}
                      </button>

                    </div>

                    {password && (
                      <div className="strength">

                        <div className="strength-top">
                          <span>
                            Password strength
                          </span>

                          <strong>
                            {passwordStrength.label}
                          </strong>
                        </div>

                        <div className="strength-track">
                          <div
                            className={`strength-fill ${passwordStrength.className}`}
                            style={{
                              width:
                                passwordStrength.width,
                            }}
                          />
                        </div>

                      </div>
                    )}

                    {errors.password && (
                      <div className="field-error">
                        {errors.password}
                      </div>
                    )}

                  </div>

                  <div className="field">

                    <label
                      className="field-label"
                      htmlFor="confirm-password"
                    >
                      Confirm password
                    </label>

                    <input
                      id="confirm-password"
                      className="input"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(
                          e.target.value
                        );
                        clearError(
                          'confirmPassword'
                        );
                      }}
                      disabled={loading}
                      autoComplete="new-password"
                    />

                    {errors.confirmPassword && (
                      <div className="field-error">
                        {errors.confirmPassword}
                      </div>
                    )}

                  </div>

                  <div className="info-box">

                    <strong
                      style={{
                        color: '#102033',
                        fontSize: 12,
                      }}
                    >
                      Security tips
                    </strong>

                    <div className="info-content">
                      Use at least 8 characters and
                      combine letters, numbers and
                      symbols. Avoid using passwords
                      that you use on other websites.
                    </div>

                  </div>

                </div>
              )}

              {/* STEP 3 */}

              {step === 3 && (
                <div className="form-section">

                  <div className="bank-box">

                    <div className="bank-box-head">

                      <strong>
                        Withdrawal account
                      </strong>

                      <span className="optional">
                        OPTIONAL
                      </span>

                    </div>

                    <div className="bank-note">
                      Add your bank account now for
                      faster withdrawal forms later.
                      You can also skip this step and
                      add an account from your wallet.
                    </div>

                    <div className="field">

                      <label
                        className="field-label"
                        htmlFor="register-bank"
                      >
                        Bank
                      </label>

                      <select
                        id="register-bank"
                        className="input"
                        value={bank}
                        onChange={(e) => {
                          setBank(e.target.value);
                          clearError('bank');
                        }}
                        disabled={loading}
                      >
                        <option value="">
                          Select your bank
                        </option>

                        {BANKS.map((item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        ))}

                      </select>

                      {errors.bank && (
                        <div className="field-error">
                          {errors.bank}
                        </div>
                      )}

                    </div>

                    <div className="field">

                      <label
                        className="field-label"
                        htmlFor="account-number"
                      >
                        Account number
                      </label>

                      <input
                        id="account-number"
                        className="input"
                        placeholder="10-digit account number"
                        value={accountNumber}
                        maxLength={10}
                        inputMode="numeric"
                        onChange={(e) => {
                          const digits =
                            e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 10);

                          setAccountNumber(digits);
                          clearError(
                            'accountNumber'
                          );
                        }}
                        disabled={loading}
                      />

                      {errors.accountNumber && (
                        <div className="field-error">
                          {errors.accountNumber}
                        </div>
                      )}

                    </div>

                    <div className="field">

                      <label
                        className="field-label"
                        htmlFor="account-name"
                      >
                        Account name
                      </label>

                      <input
                        id="account-name"
                        className="input"
                        placeholder="Name on bank account"
                        value={accountName}
                        onChange={(e) => {
                          setAccountName(
                            e.target.value
                          );
                          clearError(
                            'accountName'
                          );
                        }}
                        disabled={loading}
                      />

                      {errors.accountName && (
                        <div className="field-error">
                          {errors.accountName}
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

              {/* STEP 4 */}

              {step === 4 && (
                <div className="form-section">

                  <h3 className="section-title">
                    Review your wallet
                  </h3>

                  <p className="section-description">
                    Check your information before
                    creating your account.
                  </p>

                  <div className="card review-card">

                    <div className="review-row">
                      <span className="review-label">
                        Full name
                      </span>

                      <span className="review-value">
                        {name || 'Not provided'}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">
                        Phone
                      </span>

                      <span className="review-value">
                        {phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">
                        Security
                      </span>

                      <span className="review-value">
                        {password
                          ? 'Password configured'
                          : 'Not configured'}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">
                        Withdrawal bank
                      </span>

                      <span className="review-value">
                        {bank || 'Not added'}
                      </span>
                    </div>

                    <div className="review-row">
                      <span className="review-label">
                        Account number
                      </span>

                      <span className="review-value">
                        {accountNumber
                          ? `****${accountNumber.slice(-4)}`
                          : 'Not added'}
                      </span>
                    </div>

                  </div>

                  <label className="terms">

                    <input
                      type="checkbox"
                      checked={accept}
                      onChange={(e) => {
                        setAccept(
                          e.target.checked
                        );
                        clearError('accept');
                      }}
                      disabled={loading}
                    />

                    <span className="terms-text">
                      I agree to the ElitePay Terms
                      of Service and Privacy Policy.
                      I confirm that the information
                      provided is accurate.
                    </span>

                  </label>

                  {errors.accept && (
                    <div className="field-error">
                      {errors.accept}
                    </div>
                  )}

                </div>
              )}

              {/* ACTIONS */}

              <div className="actions">

                <button
                  className="btnGhost"
                  type="button"
                  onClick={
                    step === 1
                      ? () => router.push('/')
                      : previousStep
                  }
                  disabled={loading}
                >
                  {step === 1
                    ? 'Cancel'
                    : 'Back'}
                </button>

                <div className="actions-right">

                  {step < 4 ? (
                    <button
                      className="btn"
                      type="button"
                      onClick={nextStep}
                      disabled={loading}
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      onClick={createAccount}
                      disabled={loading}
                    >
                      Create Wallet
                    </button>
                  )}

                </div>

              </div>

              <div className="security-row">

                <div className="security-item">
                  <div className="security-icon">
                    🔒
                  </div>
                  <strong>Secure</strong>
                  <span>Account protection</span>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    ⚡
                  </div>
                  <strong>Simple</strong>
                  <span>Easy onboarding</span>
                </div>

                <div className="security-item">
                  <div className="security-icon">
                    ✓
                  </div>
                  <strong>Organized</strong>
                  <span>Wallet records</span>
                </div>

              </div>

              <div className="login-link">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() =>
                    router.push('/login')
                  }
                  disabled={loading}
                >
                  Login here
                </button>
              </div>

            </main>

          </section>
        </div>
      </div>

      {loading && (
        <div
          className="loading-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="loading-card">

            <div className="loading-orbit" />

            <h3>{loadingMessage}</h3>

            <p>
              Setting up your ElitePay experience...
            </p>

          </div>
        </div>
      )}
    </Layout>
  );
}