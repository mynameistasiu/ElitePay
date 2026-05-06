import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { loadUser, loadBalance, saveBalance, saveTx } from '../utils/storage';
import { formatNaira } from '../utils/format';

const MIN_REWARD = 70000;
const MAX_REWARD = 100000;
const BONUS_REWARD = 5000;

const phases = [
  { at: 0, label: 'Initializing secure miner' },
  { at: 22, label: 'Scanning available reward blocks' },
  { at: 48, label: 'Validating ElitePay wallet channel' },
  { at: 74, label: 'Compressing reward package' },
  { at: 96, label: 'Finalizing claim ticket' },
];

export default function Mine() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState('idle');
  const [amount, setAmount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [boostEnabled, setBoostEnabled] = useState(true);
  const [hashRate, setHashRate] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hasMined, setHasMined] = useState(false);

  useEffect(() => {
    const currentUser = loadUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);
    const minedFlag = localStorage.getItem('hasMined');
    const storedStreak = Number(localStorage.getItem('ep_mine_streak') || 0);
    setStreak(storedStreak);

    if (minedFlag === 'true') {
      setHasMined(true);
      setStage('done');
    }
  }, [router]);

  const phase = useMemo(() => {
    return [...phases].reverse().find((item) => progress >= item.at) || phases[0];
  }, [progress]);

  const startMine = () => {
    if (hasMined || stage === 'mining') return;

    const baseReward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
    const finalReward = baseReward + (boostEnabled ? BONUS_REWARD : 0);
    setAmount(finalReward);
    setStage('mining');
    setProgress(0);
    setHashRate(0);

    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(100, p + Math.floor(Math.random() * 7) + 3);
      setProgress(p);
      setHashRate(Math.floor(72 + Math.random() * 26));

      if (p >= 100) {
        clearInterval(interval);
        setStage('result');
        setHasMined(true);
        localStorage.setItem('hasMined', 'true');
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        localStorage.setItem('ep_mine_streak', String(nextStreak));
      }
    }, 420);
  };

  const claim = () => {
    setStage('claiming');

    setTimeout(() => {
      const balance = Number(loadBalance() || 0) + Number(amount);
      saveBalance(balance);
      saveTx({
        type: 'mine',
        amount,
        status: 'claimed',
        meta: { boost: boostEnabled, engine: 'ElitePay Pulse Miner' },
        created_at: new Date().toISOString(),
      });

      setStage('claimed');
      setTimeout(() => router.push('/dashboard'), 1500);
    }, 1800);
  };

  if (!user) {
    return (
      <Layout>
        <div className="center">
          <div className="card animate-pulse">Loading miner...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="ElitePay Mining Center">
      <style>{`
        .mine-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
          gap: 18px;
          align-items: stretch;
        }

        .miner-stage {
          position: relative;
          min-height: 430px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(15, 159, 110, 0.10), transparent 38%),
            linear-gradient(180deg, #ffffff, #f6fbff);
        }

        .miner-orbit {
          width: min(260px, 70vw);
          aspect-ratio: 1;
          margin: 22px auto 18px;
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: radial-gradient(circle, #ffffff 0 45%, #dff7ee 46% 58%, transparent 59%);
        }

        .miner-orbit::before,
        .miner-orbit::after {
          content: "";
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 2px dashed rgba(15, 159, 110, 0.28);
          animation: orbit 8s linear infinite;
        }

        .miner-orbit::after {
          inset: 34px;
          border-color: rgba(29, 127, 242, 0.26);
          animation-duration: 5s;
          animation-direction: reverse;
        }

        .miner-core {
          width: 118px;
          height: 118px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          z-index: 1;
          color: #ffffff;
          font-size: 42px;
          font-weight: 950;
          background: linear-gradient(135deg, #0f9f6e, #1d7ff2);
          box-shadow: 0 20px 40px rgba(15, 159, 110, 0.28);
          animation: ${stage === 'mining' ? 'softPulse 1.2s ease-in-out infinite' : 'none'};
        }

        .mine-title {
          margin: 0;
          color: #102033;
          font-size: 28px;
          font-weight: 950;
          text-align: center;
        }

        .mine-copy {
          max-width: 560px;
          margin: 8px auto 18px;
          text-align: center;
        }

        .progress-track {
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          background: #dbe6f3;
          margin: 16px 0 8px;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0f9f6e, #1d7ff2);
          transition: width 0.32s ease;
          position: relative;
        }

        .progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: scan 1.2s linear infinite;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .stat-box {
          padding: 12px;
          border-radius: 8px;
          background: #f3f8fb;
          border: 1px solid #dbe6f3;
        }

        .stat-value {
          color: #102033;
          font-size: 18px;
          font-weight: 950;
        }

        .side-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border: 1px solid #dbe6f3;
          border-radius: 8px;
          background: #f8fbfd;
        }

        .switch {
          width: 48px;
          height: 28px;
          border: 0;
          border-radius: 999px;
          background: ${boostEnabled ? '#0f9f6e' : '#cbd5e1'};
          padding: 3px;
          cursor: pointer;
        }

        .knob {
          display: block;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ffffff;
          transform: translateX(${boostEnabled ? '20px' : '0'});
          transition: transform 0.18s ease;
        }

        .reward-card {
          text-align: center;
          background: #effaf5;
          border-color: rgba(15, 159, 110, 0.28);
        }

        .reward-amount {
          color: #077a55;
          font-size: 34px;
          font-weight: 950;
          margin: 8px 0;
        }

        @media (max-width: 820px) {
          .mine-shell {
            grid-template-columns: 1fr;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="mine-shell">
        <section className="card miner-stage">
          <h1 className="mine-title">ElitePay Mining Center</h1>
          <p className="small muted mine-copy">
            Your plan is <strong>{user.plan || 'Pulse Miner'}</strong>. Run the new Pulse Miner to unlock a one-time reward between <strong>{formatNaira(MIN_REWARD)}</strong> and <strong>{formatNaira(MAX_REWARD)}</strong>.
          </p>

          <div className="miner-orbit">
            <div className="miner-core">EP</div>
          </div>

          {stage === 'idle' && !hasMined && (
            <div className="center">
              <button className="btn" onClick={startMine}>Start Pulse Mining</button>
            </div>
          )}

          {stage === 'done' && (
            <div className="center">
              <div className="small muted">You have already mined with this activation. Buy or activate another code to mine again.</div>
              <button className="btnGhost" onClick={() => router.push('/buy-code')}>Buy activation code</button>
            </div>
          )}

          {stage === 'mining' && (
            <>
              <div className="small muted" style={{ textAlign: 'center', fontWeight: 800 }}>{phase.label}</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="small muted" style={{ textAlign: 'center' }}>{progress}% complete</div>
            </>
          )}

          {stage === 'result' && (
            <div className="card reward-card">
              <div className="small muted">Reward ready</div>
              <div className="reward-amount">{formatNaira(amount)}</div>
              <p className="small muted">Your mining ticket has been verified. Claim it to your ElitePay wallet.</p>
              <button className="btn" onClick={claim}>Claim to Wallet</button>
            </div>
          )}

          {stage === 'claiming' && (
            <div className="center">
              <div className="loader" />
              <div className="loaderText">Adding reward to wallet...</div>
            </div>
          )}

          {stage === 'claimed' && (
            <div className="card reward-card">
              <div className="reward-amount">Claimed</div>
              <p className="small muted">Redirecting to your dashboard...</p>
            </div>
          )}
        </section>

        <aside className="card side-card">
          <div>
            <h3 style={{ marginTop: 0 }}>Mining controls</h3>
            <p className="small muted">Tune the miner before launch. Boost adds a small verified bonus to the final reward.</p>
          </div>

          <div className="toggle-row">
            <div>
              <div style={{ fontWeight: 900 }}>Reward Boost</div>
              <div className="small muted">Adds {formatNaira(BONUS_REWARD)}</div>
            </div>
            <button className="switch" onClick={() => setBoostEnabled((value) => !value)} aria-pressed={boostEnabled}>
              <span className="knob" />
            </button>
          </div>

          <div className="stat-grid">
            <div className="stat-box">
              <div className="small muted">Hash rate</div>
              <div className="stat-value">{hashRate || '--'}%</div>
            </div>
            <div className="stat-box">
              <div className="small muted">Streak</div>
              <div className="stat-value">{streak}</div>
            </div>
            <div className="stat-box">
              <div className="small muted">Status</div>
              <div className="stat-value">{stage}</div>
            </div>
          </div>

          <button className="btnGhost" onClick={() => router.push('/history')}>View mining history</button>
        </aside>
      </div>
    </Layout>
  );
}
