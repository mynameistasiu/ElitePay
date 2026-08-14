import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  loadUser,
  loadBalance,
  saveBalance,
  saveTx,
} from "../utils/storage";
import { formatNaira } from "../utils/format";

const MIN_REWARD = 70000;
const MAX_REWARD = 100000;
const BONUS_REWARD = 5000;

const phases = [
  {
    at: 0,
    label: "Initializing secure mining session",
  },
  {
    at: 18,
    label: "Connecting to reward network",
  },
  {
    at: 38,
    label: "Scanning available reward blocks",
  },
  {
    at: 58,
    label: "Validating wallet reward channel",
  },
  {
    at: 78,
    label: "Processing reward package",
  },
  {
    at: 94,
    label: "Finalizing mining session",
  },
];

function MineIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 18V9l6-5 6 5v9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 18v-5h6v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 19 6v5c0 4.8-2.9 8.1-7 10-4.1-1.9-7-5.2-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 7h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15 13h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="15"
        cy="13"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function HistoryIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 12a9 9 0 1 0 3-6.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 5v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="spinner"
      aria-hidden="true"
    />
  );
}

export default function Mine() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  const [stage, setStage] = useState("idle");
  const [amount, setAmount] = useState(0);
  const [progress, setProgress] = useState(0);

  const [boostEnabled, setBoostEnabled] =
    useState(true);

  const [hashRate, setHashRate] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [hasMined, setHasMined] =
    useState(false);

  const [sessionTime, setSessionTime] =
    useState(0);

  const [showInfo, setShowInfo] =
    useState(false);

  const [claimLoading, setClaimLoading] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD USER
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentUser = loadUser();

    if (!currentUser) {
      router.push("/");
      return;
    }

    setUser(currentUser);
    setBalance(
      Number(loadBalance() || 0)
    );

    try {
      const minedFlag =
        localStorage.getItem(
          "hasMined"
        );

      const storedStreak = Number(
        localStorage.getItem(
          "ep_mine_streak"
        ) || 0
      );

      setStreak(storedStreak);

      if (minedFlag === "true") {
        setHasMined(true);
        setStage("done");
      }
    } catch (error) {
      console.error(
        "Mining state error:",
        error
      );
    }
  }, [router]);

  /*
   * ---------------------------------------------------------
   * CURRENT PHASE
   * ---------------------------------------------------------
   */
  const phase = useMemo(() => {
    return (
      [...phases]
        .reverse()
        .find(
          (item) =>
            progress >= item.at
        ) || phases[0]
    );
  }, [progress]);

  /*
   * ---------------------------------------------------------
   * FORMATTING
   * ---------------------------------------------------------
   */
  const formatSessionTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remaining
    ).padStart(2, "0")}`;
  };

  /*
   * ---------------------------------------------------------
   * START MINING
   * ---------------------------------------------------------
   */
  const startMine = () => {
    if (
      hasMined ||
      stage === "mining"
    ) {
      return;
    }

    const baseReward =
      Math.floor(
        Math.random() *
          (MAX_REWARD -
            MIN_REWARD +
            1)
      ) + MIN_REWARD;

    const finalReward =
      baseReward +
      (boostEnabled
        ? BONUS_REWARD
        : 0);

    setAmount(finalReward);
    setStage("mining");
    setProgress(0);
    setHashRate(0);
    setSessionTime(0);

    let currentProgress = 0;
    let currentTime = 0;

    const interval =
      setInterval(() => {
        currentProgress = Math.min(
          100,
          currentProgress +
            Math.floor(
              Math.random() * 7
            ) +
            3
        );

        currentTime += 1;

        setProgress(
          currentProgress
        );

        setSessionTime(
          currentTime
        );

        setHashRate(
          Math.floor(
            76 +
              Math.random() *
                23
          )
        );

        if (
          currentProgress >=
          100
        ) {
          clearInterval(
            interval
          );

          setHashRate(100);
          setProgress(100);
          setStage("result");
          setHasMined(true);

          try {
            localStorage.setItem(
              "hasMined",
              "true"
            );

            const nextStreak =
              streak + 1;

            setStreak(
              nextStreak
            );

            localStorage.setItem(
              "ep_mine_streak",
              String(
                nextStreak
              )
            );
          } catch (error) {
            console.error(
              "Mining state save error:",
              error
            );
          }
        }
      }, 420);
  };

  /*
   * ---------------------------------------------------------
   * CLAIM REWARD
   * ---------------------------------------------------------
   */
  const claim = () => {
    if (
      claimLoading ||
      !amount
    ) {
      return;
    }

    setClaimLoading(true);
    setStage("claiming");

    setTimeout(() => {
      const currentBalance =
        Number(
          loadBalance() || 0
        );

      const updatedBalance =
        currentBalance +
        Number(amount);

      saveBalance(
        updatedBalance
      );

      saveTx({
        type: "mine",
        amount,
        status: "claimed",
        meta: {
          boost: boostEnabled,
          bonus: boostEnabled
            ? BONUS_REWARD
            : 0,
          engine:
            "ElitePay Pulse Miner",
          sessionTime,
          hashRate,
        },
        created_at:
          new Date().toISOString(),
      });

      setBalance(
        updatedBalance
      );

      setStage("claimed");
      setClaimLoading(false);

      setTimeout(() => {
        router.push(
          "/dashboard"
        );
      }, 1600);
    }, 1400);
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */
  if (!user) {
    return (
      <Layout>
        <div className="page-loading">
          <div className="loading-card">
            <div className="loading-spinner" />

            <div>
              <strong>
                Loading Pulse Miner...
              </strong>

              <span>
                Preparing your mining session
              </span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const estimatedReward =
    boostEnabled
      ? `${formatNaira(
          MIN_REWARD
        )} – ${formatNaira(
          MAX_REWARD +
            BONUS_REWARD
        )}`
      : `${formatNaira(
          MIN_REWARD
        )} – ${formatNaira(
          MAX_REWARD
        )}`;

  return (
    <Layout title="Pulse Miner - ElitePay">
      <style>{`

        /* ==================================================
           PAGE
        ================================================== */

        .mine-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 8px 0 35px;
        }

        .mine-layout {
          display: grid;
          grid-template-columns:
            minmax(0, 1.45fr)
            minmax(300px, 0.8fr);
          gap: 17px;
          align-items: start;
        }

        /* ==================================================
           HEADER
        ================================================== */

        .mine-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-end;
          margin-bottom: 16px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #eefaf6;
          border: 1px solid #d5eee5;
          color: #087a56;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mine-header h1 {
          margin: 10px 0 4px;
          color: #102033;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .mine-header p {
          max-width: 650px;
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.55;
        }

        .balance-mini {
          flex-shrink: 0;
          padding: 12px 15px;
          border-radius: 13px;
          background: #ffffff;
          border: 1px solid #dfe8f1;
          box-shadow:
            0 9px 24px
              rgba(
                16,
                32,
                51,
                0.05
              );
          text-align: right;
        }

        .balance-mini span {
          display: block;
          color: #94a3b8;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .balance-mini strong {
          display: block;
          margin-top: 3px;
          color: #087a56;
          font-size: 18px;
          font-weight: 950;
        }

        /* ==================================================
           MINER CARD
        ================================================== */

        .miner-card {
          position: relative;
          overflow: hidden;
          min-height: 560px;
          padding: 23px;
          border-radius: 21px;
          background:
            radial-gradient(
              circle at 75% 8%,
              rgba(
                15,
                159,
                110,
                0.10
              ),
              transparent 27%
            ),
            linear-gradient(
              180deg,
              #ffffff,
              #f7fbfd
            );
          border: 1px solid #dfe8f1;
          box-shadow:
            0 22px 55px
              rgba(
                16,
                32,
                51,
                0.08
              );
        }

        .miner-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .miner-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 9px;
          font-weight: 900;
        }

        .miner-status.live {
          background: #eaf9f2;
          color: #087a56;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .miner-card-title {
          margin: 14px 0 3px;
          color: #102033;
          font-size: 17px;
          font-weight: 950;
        }

        .miner-card-subtitle {
          margin: 0;
          color: #94a3b8;
          font-size: 10px;
        }

        /* ==================================================
           MINER VISUAL
        ================================================== */

        .miner-area {
          position: relative;
          width: min(
            300px,
            74vw
          );
          aspect-ratio: 1;
          margin: 18px auto 9px;
          display: grid;
          place-items: center;
        }

        .orbit {
          position: absolute;
          border-radius: 50%;
          border: 1px solid
            rgba(
              15,
              159,
              110,
              0.18
            );
          animation:
            rotate 10s linear infinite;
        }

        .orbit.one {
          inset: 4%;
        }

        .orbit.two {
          inset: 15%;
          border-color:
            rgba(
              29,
              127,
              242,
              0.17
            );
          animation-duration: 7s;
          animation-direction: reverse;
        }

        .orbit.three {
          inset: 26%;
          border-style: dashed;
          border-color:
            rgba(
              15,
              159,
              110,
              0.25
            );
          animation-duration: 5s;
        }

        .orbit-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0f9f6e;
          box-shadow:
            0 0 0 5px
              rgba(
                15,
                159,
                110,
                0.08
              );
        }

        .dot-a {
          top: 8%;
          left: 49%;
        }

        .dot-b {
          right: 6%;
          top: 45%;
          background: #1d7ff2;
        }

        .dot-c {
          bottom: 8%;
          left: 27%;
        }

        .miner-core {
          position: relative;
          z-index: 3;
          width: 124px;
          height: 124px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(
              circle at 35% 30%,
              #39d4ad,
              #0f9f6e 48%,
              #087a56
            );
          border: 7px solid
            rgba(
              255,
              255,
              255,
              0.78
            );
          color: #ffffff;
          box-shadow:
            0 25px 48px
              rgba(
                15,
                159,
                110,
                0.27
              ),
            0 0 0 13px
              rgba(
                15,
                159,
                110,
                0.05
              );
          animation:
            ${stage === "mining"
              ? "pulse 1.25s ease-in-out infinite"
              : "none"};
        }

        .miner-core-inner {
          text-align: center;
        }

        .miner-core-mark {
          font-size: 29px;
          line-height: 1;
          font-weight: 950;
        }

        .miner-core-label {
          margin-top: 6px;
          font-size: 8px;
          font-weight: 900;
          opacity: 0.8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ==================================================
           IDLE STATE
        ================================================== */

        .start-panel {
          max-width: 450px;
          margin: 0 auto;
          text-align: center;
        }

        .start-panel h2 {
          margin: 0;
          color: #102033;
          font-size: 19px;
          font-weight: 950;
        }

        .start-panel p {
          margin: 6px 0 14px;
          color: #718096;
          font-size: 11px;
          line-height: 1.55;
        }

        .primary-button {
          width: 100%;
          max-width: 370px;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #0f9f6e,
              #087a56
            );
          color: #ffffff;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 14px 27px
              rgba(
                15,
                159,
                110,
                0.21
              );
        }

        /* ==================================================
           MINING STATE
        ================================================== */

        .mining-panel {
          max-width: 500px;
          margin: 0 auto;
        }

        .mining-message {
          text-align: center;
          color: #334155;
          font-size: 11px;
          font-weight: 850;
        }

        .progress-track {
          height: 10px;
          margin-top: 13px;
          border-radius: 999px;
          overflow: hidden;
          background: #dce7ef;
        }

        .progress-fill {
          position: relative;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #0f9f6e,
              #18b7a4,
              #1d7ff2
            );
          transition:
            width 0.32s ease;
        }

        .progress-fill::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(
                255,
                255,
                255,
                0.5
              ),
              transparent
            );
          animation:
            scan 1.1s linear infinite;
        }

        .progress-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 7px;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 800;
        }

        .live-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 7px;
          margin-top: 13px;
        }

        .live-stat {
          padding: 10px;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e6edf3;
          text-align: center;
        }

        .live-stat span {
          display: block;
          color: #94a3b8;
          font-size: 8px;
          font-weight: 800;
        }

        .live-stat strong {
          display: block;
          margin-top: 4px;
          color: #102033;
          font-size: 13px;
          font-weight: 950;
        }

        /* ==================================================
           RESULT
        ================================================== */

        .reward-panel {
          max-width: 450px;
          margin: 0 auto;
          padding: 18px;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #eefaf6,
              #eef8ff
            );
          border: 1px solid #cfe9df;
          text-align: center;
        }

        .reward-ready {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #ffffff;
          color: #087a56;
          font-size: 9px;
          font-weight: 950;
        }

        .reward-label {
          margin-top: 10px;
          color: #64748b;
          font-size: 9px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .reward-value {
          margin: 5px 0 4px;
          color: #087a56;
          font-size: 37px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .reward-note {
          margin: 0 auto 13px;
          color: #64748b;
          max-width: 380px;
          font-size: 10px;
          line-height: 1.5;
        }

        .claim-button {
          width: 100%;
          min-height: 47px;
          border: 0;
          border-radius: 11px;
          background:
            linear-gradient(
              135deg,
              #0f9f6e,
              #087a56
            );
          color: #ffffff;
          font-size: 11px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 13px 24px
              rgba(
                15,
                159,
                110,
                0.2
              );
        }

        /* ==================================================
           DONE
        ================================================== */

        .done-panel {
          max-width: 450px;
          margin: 0 auto;
          padding: 17px;
          border-radius: 15px;
          background: #f8fafc;
          border: 1px solid #e1e8ef;
          text-align: center;
        }

        .done-icon {
          width: 45px;
          height: 45px;
          margin: 0 auto 8px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eaf9f2;
          color: #087a56;
        }

        .done-panel h3 {
          margin: 0;
          color: #102033;
          font-size: 15px;
          font-weight: 950;
        }

        .done-panel p {
          margin: 5px 0 12px;
          color: #94a3b8;
          font-size: 10px;
        }

        .outline-button {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 10px;
          border: 1px solid #d9e3eb;
          background: #ffffff;
          color: #334155;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        /* ==================================================
           SIDE PANEL
        ================================================== */

        .side-column {
          display: grid;
          gap: 14px;
        }

        .side-card {
          padding: 17px;
          border-radius: 17px;
          background: #ffffff;
          border: 1px solid #dfe8f1;
          box-shadow:
            0 12px 30px
              rgba(
                16,
                32,
                51,
                0.055
              );
        }

        .side-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 5px;
          color: #102033;
          font-size: 14px;
          font-weight: 950;
        }

        .side-subtitle {
          margin: 0 0 13px;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.45;
        }

        /* BOOST */

        .boost-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e4ebf1;
        }

        .boost-label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .boost-icon {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #fff7ed;
          color: #ea580c;
        }

        .boost-label strong {
          display: block;
          color: #102033;
          font-size: 11px;
        }

        .boost-label span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 8px;
        }

        .switch {
          width: 46px;
          height: 26px;
          padding: 3px;
          border: 0;
          border-radius: 999px;
          background: #cbd5e1;
          cursor: pointer;
        }

        .switch.active {
          background: #0f9f6e;
        }

        .switch-knob {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          transform:
            translateX(0);
          transition:
            transform 0.18s ease;
        }

        .switch.active
          .switch-knob {
          transform:
            translateX(20px);
        }

        /* REWARD PREVIEW */

        .reward-preview {
          padding: 13px;
          border-radius: 12px;
          background: #f1faf7;
          border: 1px solid #d8eee6;
        }

        .reward-preview-label {
          color: #64748b;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .reward-preview-value {
          margin-top: 5px;
          color: #087a56;
          font-size: 19px;
          font-weight: 950;
        }

        .reward-preview-note {
          margin-top: 5px;
          color: #648579;
          font-size: 8px;
          line-height: 1.4;
        }

        /* MINING INFO */

        .info-list {
          display: grid;
          gap: 8px;
        }

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #64748b;
          font-size: 9px;
          line-height: 1.45;
        }

        .info-check {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 7px;
          background: #eefaf6;
          color: #087a56;
        }

        /* SIDE BUTTONS */

        .side-button {
          width: 100%;
          min-height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dbe5ed;
          border-radius: 10px;
          background: #ffffff;
          color: #334155;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .side-button:hover {
          background: #f8fafc;
        }

        /* MODAL */

        .info-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background:
            rgba(
              15,
              23,
              42,
              0.58
            );
          backdrop-filter: blur(7px);
        }

        .info-modal {
          width: min(450px, 100%);
          padding: 20px;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 30px 85px
              rgba(
                15,
                23,
                42,
                0.25
              );
        }

        .info-modal h2 {
          margin: 0;
          color: #102033;
          font-size: 18px;
          font-weight: 950;
        }

        .info-modal p {
          color: #64748b;
          font-size: 11px;
          line-height: 1.55;
        }

        .modal-close {
          width: 100%;
          min-height: 43px;
          border: 0;
          border-radius: 10px;
          background: #102033;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        /* LOADING */

        .page-loading {
          min-height: 65vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .loading-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 19px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow:
            0 18px 45px
              rgba(
                15,
                23,
                42,
                0.08
              );
        }

        .loading-card strong {
          display: block;
          color: #102033;
          font-size: 12px;
          font-weight: 950;
        }

        .loading-card span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 9px;
        }

        .loading-spinner,
        .spinner {
          border-radius: 50%;
          border: 2px solid
            rgba(
              15,
              159,
              110,
              0.22
            );
          border-top-color: #0f9f6e;
          animation:
            spin 0.75s linear infinite;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
        }

        .spinner {
          width: 15px;
          height: 15px;
          border-color:
            rgba(
              255,
              255,
              255,
              0.3
            );
          border-top-color: #ffffff;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow:
              0 25px 48px
                rgba(
                  15,
                  159,
                  110,
                  0.27
                ),
              0 0 0 13px
                rgba(
                  15,
                  159,
                  110,
                  0.05
                );
          }

          50% {
            transform: scale(1.045);
            box-shadow:
              0 29px 58px
                rgba(
                  15,
                  159,
                  110,
                  0.34
                ),
              0 0 0 20px
                rgba(
                  15,
                  159,
                  110,
                  0.03
                );
          }
        }

        @keyframes rotate {
          from {
            transform:
              rotate(0deg);
          }

          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes scan {
          from {
            transform:
              translateX(-100%);
          }

          to {
            transform:
              translateX(100%);
          }
        }

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 900px) {
          .mine-layout {
            grid-template-columns:
              1fr;
          }

          .side-column {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .mine-page {
            padding:
              4px 0 28px;
          }

          .mine-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .balance-mini {
            width: 100%;
            text-align: left;
            box-sizing: border-box;
          }

          .miner-card {
            min-height: auto;
            padding: 18px;
            border-radius: 18px;
          }

          .side-column {
            grid-template-columns:
              1fr;
          }
        }

        @media (max-width: 500px) {
          .mine-header h1 {
            font-size: 23px;
          }

          .miner-area {
            width: min(
              270px,
              82vw
            );
          }

          .miner-core {
            width: 108px;
            height: 108px;
          }

          .live-stats {
            grid-template-columns:
              1fr 1fr 1fr;
          }

          .reward-value {
            font-size: 32px;
          }
        }

      `}</style>

      <div className="mine-page">

        {/* ==================================================
           HEADER
        ================================================== */}

        <header className="mine-header">
          <div>
            <span className="eyebrow">
              <BoltIcon size={12} />
              ElitePay Pulse Miner
            </span>

            <h1>
              Mining Center
            </h1>

            <p>
              Run your available mining session, monitor
              the process and claim the generated reward
              directly into your wallet.
            </p>
          </div>

          <div className="balance-mini">
            <span>
              Current wallet balance
            </span>

            <strong>
              {formatNaira(balance)}
            </strong>
          </div>
        </header>

        <div className="mine-layout">

          {/* ==================================================
             MAIN MINER
          ================================================== */}

          <section className="miner-card">

            <div className="miner-topbar">
              <div>
                <div className="eyebrow">
                  <MineIcon size={12} />
                  Pulse Engine
                </div>
              </div>

              <div
                className={`miner-status ${
                  stage === "mining"
                    ? "live"
                    : ""
                }`}
              >
                <span className="status-dot" />
                {stage === "mining"
                  ? "Mining live"
                  : stage === "result"
                  ? "Reward ready"
                  : stage === "claimed"
                  ? "Completed"
                  : "Ready"}
              </div>
            </div>

            <h2 className="miner-card-title">
              {stage === "mining"
                ? "Mining in progress"
                : stage === "result"
                ? "Your reward is ready"
                : stage === "claimed"
                ? "Reward successfully claimed"
                : "Ready for your mining session"}
            </h2>

            <p className="miner-card-subtitle">
              {stage === "mining"
                ? phase.label
                : "Pulse Miner"}
            </p>

            {/* MINER VISUAL */}

            <div className="miner-area">

              <div className="orbit one" />
              <div className="orbit two" />
              <div className="orbit three" />

              <span className="orbit-dot dot-a" />
              <span className="orbit-dot dot-b" />
              <span className="orbit-dot dot-c" />

              <div className="miner-core">

                <div className="miner-core-inner">
                  <div className="miner-core-mark">
                    EP
                  </div>

                  <div className="miner-core-label">
                    Pulse
                  </div>
                </div>

              </div>

            </div>

            {/* ==================================================
               IDLE
            ================================================== */}

            {stage === "idle" &&
              !hasMined && (
                <div className="start-panel">

                  <h2>
                    Start your mining session
                  </h2>

                  <p>
                    Your estimated reward is between{" "}
                    <strong>
                      {estimatedReward}
                    </strong>
                    . Enable Reward Boost below to
                    include the available bonus.
                  </p>

                  <button
                    className="primary-button"
                    onClick={startMine}
                  >
                    <MineIcon size={17} />
                    Start Pulse Mining
                  </button>

                </div>
              )}

            {/* ==================================================
               ALREADY MINED
            ================================================== */}

            {stage === "done" && (
              <div className="done-panel">

                <div className="done-icon">
                  <CheckIcon size={22} />
                </div>

                <h3>
                  Mining session completed
                </h3>

                <p>
                  This activation has already been used
                  for its available mining session.
                </p>

                <button
                  className="outline-button"
                  onClick={() =>
                    router.push(
                      "/buy-code"
                    )
                  }
                >
                  Get Another Activation
                </button>

              </div>
            )}

            {/* ==================================================
               MINING
            ================================================== */}

            {stage === "mining" && (
              <div className="mining-panel">

                <div className="mining-message">
                  {phase.label}
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="progress-meta">
                  <span>
                    Processing reward
                  </span>

                  <span>
                    {progress}%
                  </span>
                </div>

                <div className="live-stats">

                  <div className="live-stat">
                    <span>
                      Hash rate
                    </span>

                    <strong>
                      {hashRate}%
                    </strong>
                  </div>

                  <div className="live-stat">
                    <span>
                      Session
                    </span>

                    <strong>
                      {formatSessionTime(
                        sessionTime
                      )}
                    </strong>
                  </div>

                  <div className="live-stat">
                    <span>
                      Boost
                    </span>

                    <strong>
                      {boostEnabled
                        ? "+₦5k"
                        : "Off"}
                    </strong>
                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
               RESULT
            ================================================== */}

            {stage === "result" && (
              <div className="reward-panel">

                <span className="reward-ready">
                  <CheckIcon size={12} />
                  Reward verified
                </span>

                <div className="reward-label">
                  Available mining reward
                </div>

                <div className="reward-value">
                  {formatNaira(
                    amount
                  )}
                </div>

                <p className="reward-note">
                  Your mining session has finished.
                  Claim this reward to add it to
                  your ElitePay wallet balance.
                </p>

                <button
                  className="claim-button"
                  onClick={claim}
                  disabled={
                    claimLoading
                  }
                >
                  {claimLoading ? (
                    <>
                      <Spinner />
                      Adding to wallet...
                    </>
                  ) : (
                    <>
                      <WalletIcon size={16} />
                      Claim to Wallet
                    </>
                  )}
                </button>

              </div>
            )}

            {/* ==================================================
               CLAIMING
            ================================================== */}

            {stage ===
              "claiming" && (
              <div className="reward-panel">

                <Spinner />

                <div
                  style={{
                    marginTop: 10,
                    color: "#102033",
                    fontSize: 13,
                    fontWeight: 950,
                  }}
                >
                  Updating wallet...
                </div>

                <p className="reward-note">
                  Adding your mining reward to
                  your available wallet balance.
                </p>

              </div>
            )}

            {/* ==================================================
               CLAIMED
            ================================================== */}

            {stage === "claimed" && (
              <div className="reward-panel">

                <span className="reward-ready">
                  <CheckIcon size={12} />
                  Successfully claimed
                </span>

                <div className="reward-value">
                  {formatNaira(
                    amount
                  )}
                </div>

                <p className="reward-note">
                  Your wallet balance has been updated.
                  Returning you to the wallet dashboard.
                </p>

              </div>
            )}

          </section>

          {/* ==================================================
             SIDE COLUMN
          ================================================== */}

          <aside className="side-column">

            {/* BOOST CARD */}

            <section className="side-card">

              <div className="side-title">
                <BoltIcon size={18} />
                Mining Controls
              </div>

              <p className="side-subtitle">
                Configure your session before you begin.
              </p>

              <div className="boost-row">

                <div className="boost-label">

                  <div className="boost-icon">
                    <BoltIcon size={17} />
                  </div>

                  <div>
                    <strong>
                      Reward Boost
                    </strong>

                    <span>
                      Bonus:{" "}
                      {formatNaira(
                        BONUS_REWARD
                      )}
                    </span>
                  </div>

                </div>

                <button
                  className={`switch ${
                    boostEnabled
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setBoostEnabled(
                      (value) =>
                        !value
                    )
                  }
                  disabled={
                    hasMined ||
                    stage ===
                      "mining"
                  }
                  aria-pressed={
                    boostEnabled
                  }
                >
                  <span className="switch-knob" />
                </button>

              </div>

              <div
                className="reward-preview"
                style={{
                  marginTop: 10,
                }}
              >
                <div className="reward-preview-label">
                  Estimated reward
                </div>

                <div className="reward-preview-value">
                  {estimatedReward}
                </div>

                <div className="reward-preview-note">
                  Final reward is displayed after the
                  mining session is completed.
                </div>
              </div>

            </section>

            {/* SESSION STATS */}

            <section className="side-card">

              <div className="side-title">
                <HistoryIcon size={18} />
                Session Overview
              </div>

              <div className="info-list">

                <div className="info-item">
                  <span className="info-check">
                    <CheckIcon size={11} />
                  </span>

                  <span>
                    Current streak:{" "}
                    <strong>
                      {streak}
                    </strong>{" "}
                    session
                    {streak === 1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-check">
                    <CheckIcon size={11} />
                  </span>

                  <span>
                    Session status:{" "}
                    <strong>
                      {stage}
                    </strong>
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-check">
                    <CheckIcon size={11} />
                  </span>

                  <span>
                    Wallet destination:{" "}
                    <strong>
                      ElitePay Wallet
                    </strong>
                  </span>
                </div>

              </div>

            </section>

            {/* SECURITY */}

            <section className="side-card">

              <div className="side-title">
                <ShieldIcon size={18} />
                Mining Safety
              </div>

              <p className="side-subtitle">
                Keep your wallet activity organized and
                review your transaction history regularly.
              </p>

              <div className="info-list">

                <div className="info-item">
                  <span className="info-check">
                    <ShieldIcon size={11} />
                  </span>

                  <span>
                    Mining rewards are recorded in your
                    wallet transaction history.
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-check">
                    <ShieldIcon size={11} />
                  </span>

                  <span>
                    Review the final reward before claiming.
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-check">
                    <ShieldIcon size={11} />
                  </span>

                  <span>
                    Never share your account login
                    information.
                  </span>
                </div>

              </div>

              <button
                className="side-button"
                onClick={() =>
                  setShowInfo(true)
                }
              >
                Learn how Pulse Miner works
              </button>

            </section>

            {/* HISTORY */}

            <section className="side-card">

              <div className="side-title">
                <HistoryIcon size={18} />
                Wallet Activity
              </div>

              <p className="side-subtitle">
                View all previous mining and wallet
                transactions.
              </p>

              <button
                className="side-button"
                onClick={() =>
                  router.push(
                    "/history"
                  )
                }
              >
                <HistoryIcon size={15} />
                View Mining History
              </button>

              <button
                className="side-button"
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
              >
                <WalletIcon size={15} />
                Back to Wallet
              </button>

            </section>

          </aside>

        </div>
      </div>

      {/* ==================================================
         INFORMATION MODAL
      ================================================== */}

      {showInfo && (
        <div
          className="info-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowInfo(false);
            }
          }}
        >
          <div className="info-modal">

            <div
              className="side-title"
              style={{
                marginBottom: 10,
              }}
            >
              <ShieldIcon size={19} />
              About Pulse Miner
            </div>

            <h2>
              How your mining session works
            </h2>

            <p>
              Start a Pulse Miner session and monitor
              the progress as the reward process runs.
              When the session reaches 100%, your reward
              becomes available to claim.
            </p>

            <div className="info-list">

              <div className="info-item">
                <span className="info-check">
                  1
                </span>

                <span>
                  Start the mining session from the
                  Mining Center.
                </span>
              </div>

              <div className="info-item">
                <span className="info-check">
                  2
                </span>

                <span>
                  Watch the live progress and session
                  status.
                </span>
              </div>

              <div className="info-item">
                <span className="info-check">
                  3
                </span>

                <span>
                  Review the generated reward once the
                  session completes.
                </span>
              </div>

              <div className="info-item">
                <span className="info-check">
                  4
                </span>

                <span>
                  Claim the reward to update your wallet
                  balance.
                </span>
              </div>

            </div>

            <button
              className="modal-close"
              onClick={() =>
                setShowInfo(false)
              }
              style={{
                marginTop: 15,
              }}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </Layout>
  );
}
