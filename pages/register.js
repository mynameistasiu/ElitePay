import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparing your secure wallet...');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const user = loadUser();
    if (user) router.push('/dashboard');
  }, [router]);

  const onPhoneChange = (value) => {
    const digits = value.replace(/\D/g, '');
    setPhone(digits.slice(0, 11));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
  };

  const onAccountNumberChange = (value) => {
    const digits = value.replace(/\D/g, '');
    setAccountNumber(digits.slice(0, 10));
    if (errors.accountNumber) setErrors((prev) => ({ ...prev, accountNumber: null }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!name || name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (!phone) nextErrors.phone = 'Phone number is required.';
    else if (!/^\d{11}$/.test(phone)) nextErrors.phone = 'Phone must be 11 digits, for example 08031234567.';

    const hasAnyBankDetail = bank || accountNumber || accountName;
    if (hasAnyBankDetail) {
      if (!bank) nextErrors.bank = 'Select your withdrawal bank.';
      if (!/^\d{10}$/.test(accountNumber)) nextErrors.accountNumber = 'Account number must be 10 digits.';
      if (!accountName || accountName.trim().length < 2) nextErrors.accountName = 'Enter the account name.';
    }

    if (!accept) nextErrors.accept = 'You must accept the terms and privacy policy.';
    return nextErrors;
  };

  const start = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      alert(Object.values(nextErrors)[0]);
      return;
    }

    setLoadingMessage('Creating your ElitePay account...');
    setLoading(true);

    setTimeout(() => setLoadingMessage('Activating Pulse Miner...'), 600);
    setTimeout(() => setLoadingMessage('Finalizing security settings...'), 1200);

    setTimeout(() => {
      const savedAccount = bank && accountNumber && accountName
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
        plan: 'Pulse Miner',
        withdrawalAccounts: savedAccount ? [savedAccount] : [],
        defaultWithdrawalAccountId: savedAccount?.id || '',
      };
      saveUser(user);
      saveBalance(0);
      saveTx([]);
      setLoading(false);
      router.push('/dashboard');
    }, 1700);
  };

  return (
    <Layout title="Register - ElitePay Wallet">
      <style>{`
        .auth-shell {
          min-height: calc(100vh - 190px);
          display: grid;
          place-items: center;
          padding: 16px 0 28px;
        }

        .auth-card {
          width: min(940px, 100%);
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          overflow: hidden;
          padding: 0;
        }

        .auth-brand {
          display: grid;
          align-content: center;
          justify-items: center;
          gap: 14px;
          min-height: 460px;
          padding: 28px;
          color: #ffffff;
          text-align: center;
          background:
            radial-gradient(circle at 50% 32%, rgba(15, 159, 110, 0.34), transparent 48%),
            linear-gradient(135deg, #102033, #0f5f48);
        }

        .auth-brand img {
          width: min(220px, 78%);
          height: auto;
          filter: drop-shadow(0 18px 26px rgba(0, 0, 0, 0.28));
        }

        .auth-brand h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.05;
        }

        .auth-brand p {
          margin: 0;
          max-width: 310px;
          color: rgba(255, 255, 255, 0.76);
        }

        .auth-form {
          padding: 34px;
          background: #ffffff;
        }

        .auth-kicker {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          background: #e9f8f2;
          color: #077a55;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .auth-title {
          margin: 0;
          color: #102033;
          font-size: 30px;
          font-weight: 950;
        }

        .auth-copy {
          margin: 8px 0 22px;
          color: #64748b;
        }

        .field-label {
          display: block;
          margin: 12px 0 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 850;
        }

        .field-help {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .field-error {
          margin-top: 6px;
          color: #b42318;
          font-size: 13px;
          font-weight: 800;
        }

        .terms-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 12px;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          background: #f8fafc;
        }

        .bank-section {
          margin-top: 18px;
          padding: 14px;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          background: #f8fafc;
        }

        .bank-section__head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 4px;
        }

        .bank-section__head strong {
          color: #102033;
        }

        .bank-badge {
          padding: 4px 8px;
          border-radius: 999px;
          background: #e9f8f2;
          color: #077a55;
          font-size: 11px;
          font-weight: 900;
        }

        .terms-row button {
          flex: 0 0 auto;
        }

        .auth-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .auth-switch {
          margin-top: 16px;
          color: #64748b;
          font-size: 13px;
        }

        .auth-switch button {
          border: 0;
          background: transparent;
          color: #077a55;
          font-weight: 900;
          cursor: pointer;
          padding: 0;
        }

        @media (max-width: 760px) {
          .auth-card {
            grid-template-columns: 1fr;
          }

          .auth-brand {
            min-height: 240px;
            padding: 22px;
          }

          .auth-brand img {
            width: min(170px, 72%);
          }

          .auth-form {
            padding: 24px 18px;
          }

          .terms-row {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="auth-shell">
        <section className="card auth-card">
          <div className="auth-brand">
            <img src="/elitepay-logo.png" alt="ElitePay logo" />
            <h1>Create your wallet</h1>
            <p>Register once and your details will be reused across ElitePay payment flows.</p>
          </div>

          <div className="auth-form">
            <span className="auth-kicker">New account</span>
            <h2 className="auth-title">Get Started</h2>
            <p className="auth-copy">Enter your account details to activate Pulse Miner.</p>

            <label className="field-label" htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              disabled={loading}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}

            <label className="field-label" htmlFor="register-phone">Phone number</label>
            <input
              id="register-phone"
              className="input"
              placeholder="08031234567"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              maxLength={11}
              disabled={loading}
              inputMode="numeric"
            />
            <div className="field-help">Use your 11-digit local phone number.</div>
            {errors.phone && <div className="field-error">{errors.phone}</div>}

            <div className="bank-section">
              <div className="bank-section__head">
                <strong>Withdrawal account</strong>
                <span className="bank-badge">Optional</span>
              </div>
              <div className="field-help">Save your bank details now so withdrawals can be filled automatically later.</div>

              <label className="field-label" htmlFor="register-bank">Bank</label>
              <select
                id="register-bank"
                className="input"
                value={bank}
                onChange={(e) => {
                  setBank(e.target.value);
                  if (errors.bank) setErrors((prev) => ({ ...prev, bank: null }));
                }}
                disabled={loading}
              >
                <option value="">Select bank</option>
                {BANKS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              {errors.bank && <div className="field-error">{errors.bank}</div>}

              <label className="field-label" htmlFor="register-account-number">Account number</label>
              <input
                id="register-account-number"
                className="input"
                placeholder="10-digit account number"
                value={accountNumber}
                onChange={(e) => onAccountNumberChange(e.target.value)}
                maxLength={10}
                disabled={loading}
                inputMode="numeric"
              />
              {errors.accountNumber && <div className="field-error">{errors.accountNumber}</div>}

              <label className="field-label" htmlFor="register-account-name">Account name</label>
              <input
                id="register-account-name"
                className="input"
                placeholder="Name on bank account"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value);
                  if (errors.accountName) setErrors((prev) => ({ ...prev, accountName: null }));
                }}
                disabled={loading}
              />
              {errors.accountName && <div className="field-error">{errors.accountName}</div>}
            </div>

            <div className="terms-row">
              <button
                type="button"
                className={accept ? 'btn' : 'btnGhost'}
                onClick={() => {
                  setAccept((value) => !value);
                  if (errors.accept) setErrors((prev) => ({ ...prev, accept: null }));
                }}
                aria-pressed={accept}
                disabled={loading}
              >
                {accept ? 'Accepted' : 'Accept Terms'}
              </button>
              <div className="small muted">By continuing you accept ElitePay terms and privacy policy.</div>
            </div>
            {errors.accept && <div className="field-error">{errors.accept}</div>}

            <div className="auth-actions">
              <button className="btn" onClick={start} disabled={loading}>
                {loading ? 'Starting...' : 'Create Account'}
              </button>
              <button className="btnGhost" onClick={() => router.push('/login')} disabled={loading}>
                Login
              </button>
            </div>

            <div className="auth-switch">
              Already registered? <button onClick={() => router.push('/login')}>Login here</button>
            </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="loadingOverlay" role="status" aria-live="polite">
          <div className="loadingBox">
            <div className="loader" aria-hidden="true">
              <span className="ring" />
              <span className="ring ring2" />
              <span className="spark" />
            </div>
            <div>
              <div className="loaderText">{loadingMessage}</div>
              <div className="small muted" style={{ marginTop: 6 }}>This only takes a moment...</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
