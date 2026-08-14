import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  loadUser,
  loadBalance,
  loadTx,
} from "../utils/storage";
import { formatNaira } from "../utils/format";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] =
    useState("Loading dashboard...");

  const [showIntro, setShowIntro] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);

  const [stats, setStats] = useState({
    totalMined: 0,
    totalWithdrawn: 0,
    txCount: 0,
  });

  const [restricted, setRestricted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  /*
   * ---------------------------------------------------------
   * LOAD USER + WALLET
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentUser = loadUser();

    if (!currentUser) {
      router.push("/");
      return;
    }

    setUser(currentUser);

    const currentBalance = Number(loadBalance() || 0);
    setBalance(currentBalance);

    const transactions = loadTx() || [];
    setTx(transactions);

    computeStats(transactions);

    try {
      const seenIntro =
        localStorage.getItem("gt_seen_intro");

      if (!seenIntro) {
        setShowIntro(true);
        localStorage.setItem("gt_seen_intro", "1");
      } else {
        const seenWelcome =
          localStorage.getItem("gt_seen_welcome");

        if (!seenWelcome) {
          setShowWelcome(true);

          localStorage.setItem(
            "gt_seen_welcome",
            "1"
          );

          setTimeout(() => {
            setShowWelcome(false);
          }, 2500);
        }
      }
    } catch (error) {
      console.error(
        "Dashboard onboarding error:",
        error
      );
    }
  }, [router]);

  /*
   * ---------------------------------------------------------
   * RESTRICTION CHECK
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const checkRestriction = () => {
      try {
        const activated =
          localStorage.getItem("gt_activated") === "true";

        if (activated) {
          setRestricted(false);
          setTimeLeft(0);
          return;
        }

        const end =
          localStorage.getItem(
            "gt_restriction_end"
          );

        if (!end) {
          setRestricted(false);
          setTimeLeft(0);
          return;
        }

        const remaining =
          Number(end) - Date.now();

        if (remaining <= 0) {
          setRestricted(true);
          setTimeLeft(0);
        } else {
          setRestricted(false);
          setTimeLeft(remaining);
        }
      } catch (error) {
        console.error(
          "Restriction check error:",
          error
        );
      }
    };

    checkRestriction();

    const interval = setInterval(
      checkRestriction,
      1000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * ---------------------------------------------------------
   * PREVENT BACK NAVIGATION DURING RESTRICTION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!restricted) return;

    const blockBack = () => {
      try {
        window.history.pushState(
          null,
          "",
          window.location.href
        );
      } catch (error) {
        console.error(
          "Navigation protection error:",
          error
        );
      }
    };

    blockBack();

    window.addEventListener(
      "popstate",
      blockBack
    );

    return () => {
      window.removeEventListener(
        "popstate",
        blockBack
      );
    };
  }, [restricted]);

  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */
  function computeStats(transactions) {
    const totalMined = transactions
      .filter(
        (item) =>
          item.type === "mine" &&
          (
            item.status === "claimed" ||
            item.status === "successful"
          )
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalWithdrawn = transactions
      .filter(
        (item) =>
          item.type === "withdraw_confirm" ||
          (
            item.type === "withdraw" &&
            item.status === "successful"
          )
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    setStats({
      totalMined,
      totalWithdrawn,
      txCount: transactions.length || 0,
    });
  }

  /*
   * ---------------------------------------------------------
   * QUICK NAVIGATION
   * ---------------------------------------------------------
   */
  const startQuick = (
    path,
    message = "Opening..."
  ) => {
    setLoadingMessage(message);
    setLoading(true);

    setTimeout(() => {
      setLoadingMessage(
        "Preparing secure session..."
      );
    }, 450);

    setTimeout(() => {
      router.push(path);
    }, 900);
  };

  /*
   * ---------------------------------------------------------
   * REFERRAL
   * ---------------------------------------------------------
   */
  const copyReferral = async () => {
    const referralLink =
      `${
        typeof window !== "undefined"
          ? window.location.origin
          : ""
      }/register?ref=${user?.phone || ""}`;

    try {
      await navigator.clipboard.writeText(
        referralLink
      );

      alert(
        "Referral link copied to clipboard."
      );
    } catch (error) {
      window.prompt(
        "Copy this referral link:",
        referralLink
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * SHARE
   * ---------------------------------------------------------
   */
  const shareWallet = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "";

    const shareData = {
      title: "ElitePay Wallet",
      text:
        "Join me on ElitePay Wallet.",
      url: shareUrl,
    };

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "ElitePay link copied to clipboard."
      );
    } catch (error) {
      if (
        error?.name !== "AbortError"
      ) {
        copyReferral();
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * TIME FORMAT
   * ---------------------------------------------------------
   */
  const formatTime = (ms) => {
    const secondsTotal = Math.floor(
      ms / 1000
    );

    const minutes = Math.floor(
      secondsTotal / 60
    );

    const seconds =
      secondsTotal % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  /*
   * ---------------------------------------------------------
   * TRANSACTION HELPERS
   * ---------------------------------------------------------
   */
  const getTransactionTitle = (item) => {
    const type = String(
      item?.type || "transaction"
    );

    const titles = {
      mine: "Mining Reward",
      withdraw: "Withdrawal",
      withdraw_confirm:
        "Withdrawal Confirmed",
      buy_code:
        "Withdrawal Code Purchase",
      activation:
        "Account Activation",
    };

    return (
      titles[type] ||
      type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        )
    );
  };

  const getTransactionStatus = (
    status
  ) => {
    const normalized = String(
      status || "pending"
    ).toLowerCase();

    if (
      normalized === "successful" ||
      normalized === "claimed" ||
      normalized === "completed"
    ) {
      return {
        label: "Completed",
        className: "success",
      };
    }

    if (
      normalized === "failed" ||
      normalized === "rejected" ||
      normalized === "cancelled"
    ) {
      return {
        label: "Failed",
        className: "failed",
      };
    }

    return {
      label: "Pending",
      className: "pending",
    };
  };

  /*
   * ---------------------------------------------------------
   * LOADING SCREEN
   * ---------------------------------------------------------
   */
  if (!user) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="loading-card">
            <div className="big-spinner" />
            <strong>
              Loading your wallet...
            </strong>
            <span>
              Preparing your secure dashboard
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  const firstName =
    user.fullName?.split(" ")[0] ||
    "User";

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "EP";

  const previewTx = (
    tx || []
  ).slice(0, 5);

  const slides = [
    {
      title:
        "Welcome to ElitePay Wallet",
      subtitle:
        "Your digital wallet, all in one place.",
      body:
        "Manage your balance, mining rewards, withdrawals and transactions from one simple wallet dashboard.",
      icon: "EP",
    },
    {
      title:
        "Build your wallet balance",
      subtitle:
        "Use Pulse Miner to earn.",
      body:
        "Start mining, claim your available rewards, monitor your balance and use your available wallet features.",
      icon: "01",
    },
    {
      title:
        "Stay in control",
      subtitle:
        "Secure wallet management.",
      body:
        "Review transactions, manage your account and use the available wallet tools whenever you need them.",
      icon: "02",
    },
  ];

  return (
    <Layout title="Wallet - ElitePay">
      <style>{`

        /* ==================================================
           GLOBAL DASHBOARD
        ================================================== */

        .wallet-shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 16px 0 35px;
        }

        .wallet-container {
          display: grid;
          gap: 18px;
        }

        /* ==================================================
           TOP BAR
        ================================================== */

        .wallet-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .welcome-title {
          margin: 0;
          color: #102033;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .welcome-subtitle {
          margin: 5px 0 0;
          color: #718096;
          font-size: 13px;
        }

        .avatar-button {
          width: 48px;
          height: 48px;
          border: 0;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            #0f9f6e,
            #1bb9a7
          );
          color: #ffffff;
          font-size: 15px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 9px 22px rgba(
              15,
              159,
              110,
              0.2
            );
        }

        /* ==================================================
           WALLET HERO
        ================================================== */

        .wallet-hero {
          position: relative;
          overflow: hidden;
          min-height: 285px;
          padding: 25px;
          border-radius: 24px;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 83% 12%,
              rgba(
                45,
                212,
                191,
                0.28
              ),
              transparent 30%
            ),
            radial-gradient(
              circle at 5% 115%,
              rgba(
                255,
                255,
                255,
                0.08
              ),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #0d1f32,
              #0d513f 62%,
              #087f61
            );
          box-shadow:
            0 24px 55px rgba(
              15,
              54,
              45,
              0.2
            );
        }

        .wallet-hero::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          right: -115px;
          top: -120px;
          border-radius: 50%;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
          box-shadow:
            0 0 0 35px
              rgba(
                255,
                255,
                255,
                0.035
              ),
            0 0 0 70px
              rgba(
                255,
                255,
                255,
                0.02
              );
        }

        .wallet-hero-content {
          position: relative;
          z-index: 2;
        }

        .wallet-top-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .wallet-label {
          color: rgba(
            255,
            255,
            255,
            0.68
          );
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .wallet-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(
            255,
            255,
            255,
            0.1
          );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
          font-size: 10px;
          font-weight: 850;
        }

        .wallet-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5ee9a8;
          box-shadow: 0 0 0 4px
            rgba(
              94,
              233,
              168,
              0.11
            );
        }

        .wallet-balance-label {
          margin-top: 28px;
          color: rgba(
            255,
            255,
            255,
            0.68
          );
          font-size: 12px;
          font-weight: 750;
        }

        .wallet-balance {
          margin: 6px 0 0;
          font-size: clamp(
            38px,
            7vw,
            58px
          );
          line-height: 1;
          letter-spacing: -0.045em;
          font-weight: 950;
        }

        .wallet-account {
          margin-top: 9px;
          color: rgba(
            255,
            255,
            255,
            0.58
          );
          font-size: 11px;
        }

        .wallet-actions {
          display: grid;
          grid-template-columns:
            1fr 1fr 1fr;
          gap: 9px;
          margin-top: 28px;
          max-width: 600px;
        }

        .wallet-action {
          min-height: 48px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
          border-radius: 12px;
          background: rgba(
            255,
            255,
            255,
            0.09
          );
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition:
            transform 0.16s ease,
            background 0.16s ease;
        }

        .wallet-action:hover {
          transform: translateY(-1px);
          background: rgba(
            255,
            255,
            255,
            0.15
          );
        }

        .wallet-action.primary {
          background: #ffffff;
          color: #0c7658;
          border-color: #ffffff;
        }

        .wallet-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ==================================================
           WALLET STATISTICS
        ================================================== */

        .wallet-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
        }

        .wallet-stat {
          padding: 17px;
          border-radius: 16px;
          border: 1px solid #dfe8f1;
          background: #ffffff;
          box-shadow:
            0 10px 30px
              rgba(
                16,
                32,
                51,
                0.05
              );
        }

        .wallet-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .wallet-stat-icon {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #eefaf6;
          color: #07805d;
          font-size: 15px;
          font-weight: 950;
        }

        .wallet-stat small {
          color: #64748b;
          font-size: 10px;
          font-weight: 850;
        }

        .wallet-stat strong {
          display: block;
          margin-top: 9px;
          color: #102033;
          font-size: 21px;
          font-weight: 950;
        }

        /* ==================================================
           MAIN GRID
        ================================================== */

        .wallet-main-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 0.9fr)
            minmax(0, 1.5fr);
          gap: 16px;
          align-items: start;
        }

        .wallet-card {
          padding: 18px;
          border-radius: 18px;
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

        .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .card-heading h2 {
          margin: 0;
          color: #102033;
          font-size: 17px;
          font-weight: 950;
        }

        .card-heading p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .view-link {
          border: 0;
          background: transparent;
          color: #07805d;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        /* ==================================================
           QUICK ACTIONS
        ================================================== */

        .quick-actions {
          display: grid;
          gap: 9px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 12px;
          border: 1px solid #e1e8ef;
          border-radius: 12px;
          background: #ffffff;
          color: #102033;
          text-align: left;
          cursor: pointer;
          transition:
            border-color 0.16s ease,
            background 0.16s ease,
            transform 0.16s ease;
        }

        .quick-action:hover {
          transform: translateY(-1px);
          background: #f7fcfa;
          border-color:
            rgba(
              15,
              159,
              110,
              0.27
            );
        }

        .quick-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: #eefaf6;
          color: #07805d;
          font-size: 15px;
          font-weight: 950;
        }

        .quick-copy {
          flex: 1;
          min-width: 0;
        }

        .quick-copy strong {
          display: block;
          color: #102033;
          font-size: 12px;
          font-weight: 900;
        }

        .quick-copy span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 10px;
        }

        .quick-arrow {
          color: #94a3b8;
          font-size: 15px;
        }

        /* ==================================================
           TRANSACTIONS
        ================================================== */

        .transaction-list {
          display: grid;
          gap: 9px;
        }

        .transaction-item {
          display: grid;
          grid-template-columns:
            42px minmax(0, 1fr)
            auto;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border-radius: 12px;
          border: 1px solid #e8eef4;
          background: #fbfdff;
        }

        .transaction-icon {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eefaf6;
          color: #07805d;
          font-size: 14px;
          font-weight: 950;
        }

        .transaction-main {
          min-width: 0;
        }

        .transaction-title {
          color: #102033;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .transaction-date {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 9px;
        }

        .transaction-right {
          text-align: right;
        }

        .transaction-amount {
          color: #102033;
          font-size: 12px;
          font-weight: 950;
        }

        .transaction-status {
          display: inline-flex;
          margin-top: 4px;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
        }

        .transaction-status.success {
          background: #eaf9f2;
          color: #087a56;
        }

        .transaction-status.pending {
          background: #fff8e7;
          color: #a66a00;
        }

        .transaction-status.failed {
          background: #fff1f2;
          color: #be263d;
        }

        .empty-transactions {
          padding: 26px 15px;
          text-align: center;
          border: 1px dashed #cdd8e3;
          border-radius: 13px;
          background: #f8fafc;
        }

        .empty-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 8px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eef2f7;
          color: #64748b;
          font-weight: 950;
        }

        .empty-transactions strong {
          display: block;
          color: #334155;
          font-size: 12px;
        }

        .empty-transactions span {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-size: 10px;
        }

        /* ==================================================
           PROFILE / REFERRAL
        ================================================== */

        .profile-wallet {
          margin-top: 16px;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 16px;
        }

        .profile-mini {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .profile-avatar {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #0f9f6e,
            #18b7a4
          );
          color: #ffffff;
          font-size: 14px;
          font-weight: 950;
        }

        .profile-mini strong {
          display: block;
          color: #102033;
          font-size: 12px;
          font-weight: 950;
        }

        .profile-mini span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 10px;
        }

        .profile-details {
          margin-top: 13px;
          display: grid;
          gap: 0;
        }

        .profile-detail {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 0;
          border-top: 1px solid #edf2f7;
          font-size: 10px;
        }

        .profile-detail span {
          color: #94a3b8;
        }

        .profile-detail strong {
          color: #334155;
          text-align: right;
        }

        .referral-box {
          position: relative;
          overflow: hidden;
          padding: 16px;
          border-radius: 15px;
          background:
            linear-gradient(
              135deg,
              #f4fbf8,
              #ebf8f4
            );
          border: 1px solid #d6eee5;
        }

        .referral-box::after {
          content: "";
          position: absolute;
          width: 110px;
          height: 110px;
          right: -45px;
          top: -45px;
          border-radius: 50%;
          border: 20px solid
            rgba(
              15,
              159,
              110,
              0.06
            );
        }

        .referral-box h3 {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #102033;
          font-size: 13px;
          font-weight: 950;
        }

        .referral-box p {
          position: relative;
          z-index: 1;
          margin: 5px 0 12px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.5;
        }

        .referral-button {
          position: relative;
          z-index: 1;
          width: 100%;
          border: 1px solid #bfe3d5;
          border-radius: 10px;
          padding: 10px;
          background: #ffffff;
          color: #087a56;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        /* ==================================================
           RESTRICTION
        ================================================== */

        .restriction-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background:
            rgba(
              15,
              23,
              42,
              0.68
            );
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
        }

        .restriction-card {
          width: min(530px, 100%);
          padding: 23px;
          border-radius: 19px;
          background: #ffffff;
          box-shadow:
            0 35px 100px
              rgba(
                15,
                23,
                42,
                0.27
              );
          text-align: center;
        }

        .restriction-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto 13px;
          display: grid;
          place-items: center;
          border-radius: 17px;
          background: #fff1f2;
          color: #be263d;
          border: 1px solid #fecdd3;
          font-size: 24px;
          font-weight: 950;
        }

        .restriction-card h2 {
          margin: 0;
          color: #102033;
          font-size: 21px;
          font-weight: 950;
        }

        .restriction-card > p {
          margin: 8px auto 14px;
          max-width: 440px;
          color: #64748b;
          font-size: 12px;
          line-height: 1.55;
        }

        .restriction-list {
          display: grid;
          gap: 7px;
          padding: 0;
          margin: 0 0 16px;
          list-style: none;
          text-align: left;
        }

        .restriction-list li {
          display: grid;
          grid-template-columns:
            25px minmax(0, 1fr);
          gap: 9px;
          align-items: start;
          padding: 9px;
          border-radius: 10px;
          background: #fff8f8;
          border: 1px solid #fee2e2;
          color: #475569;
          font-size: 10px;
          line-height: 1.45;
        }

        .restriction-number {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #fee2e2;
          color: #b42318;
          font-size: 9px;
          font-weight: 950;
        }

        .restriction-button {
          width: 100%;
          border: 0;
          border-radius: 11px;
          padding: 13px 16px;
          background: linear-gradient(
            135deg,
            #0f9f6e,
            #087a56
          );
          color: #ffffff;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
          box-shadow:
            0 12px 25px
              rgba(
                15,
                159,
                110,
                0.2
              );
        }

        /* ==================================================
           INTRO MODAL
        ================================================== */

        .intro-overlay,
        .welcome-overlay,
        .dashboard-loading {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .intro-overlay,
        .dashboard-loading {
          background:
            rgba(
              15,
              23,
              42,
              0.57
            );
          backdrop-filter: blur(7px);
        }

        .welcome-overlay {
          pointer-events: none;
        }

        .intro-modal {
          width: min(500px, 100%);
          padding: 21px;
          border-radius: 19px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow:
            0 30px 90px
              rgba(
                15,
                23,
                42,
                0.26
              );
        }

        .intro-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .intro-brand {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .intro-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #eefaf6;
          color: #07805d;
          font-size: 13px;
          font-weight: 950;
        }

        .intro-title {
          color: #102033;
          font-size: 13px;
          font-weight: 950;
        }

        .intro-subtitle {
          margin-top: 2px;
          color: #94a3b8;
          font-size: 10px;
        }

        .intro-body {
          min-height: 70px;
          margin: 17px 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.65;
        }

        .intro-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .intro-dots {
          display: flex;
          gap: 5px;
        }

        .intro-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d7e0e8;
          cursor: pointer;
        }

        .intro-dot.active {
          width: 19px;
          border-radius: 999px;
          background: #0f9f6e;
        }

        .intro-controls {
          display: flex;
          gap: 7px;
        }

        .intro-button,
        .intro-skip {
          border: 0;
          border-radius: 9px;
          padding: 9px 12px;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .intro-button {
          background: #0f9f6e;
          color: #ffffff;
        }

        .intro-skip {
          background: #f1f5f9;
          color: #64748b;
        }

        /* ==================================================
           WELCOME POPUP
        ================================================== */

        .welcome-box {
          width: min(390px, 100%);
          padding: 17px;
          border-radius: 15px;
          background: #ffffff;
          box-shadow:
            0 25px 65px
              rgba(
                15,
                23,
                42,
                0.17
              );
          border: 1px solid #e2e8f0;
          animation:
            welcomeIn 0.3s ease;
        }

        .welcome-avatar {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #eefaf6;
          color: #07805d;
          font-weight: 950;
        }

        /* ==================================================
           LOADING
        ================================================== */

        .loading-card {
          width: min(360px, 100%);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 13px;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 25px 70px
              rgba(
                15,
                23,
                42,
                0.2
              );
        }

        .loader-ring {
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 3px solid #e2e8f0;
          border-top-color: #0f9f6e;
          animation:
            spin 0.8s linear infinite;
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
          font-size: 10px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes welcomeIn {
          from {
            opacity: 0;
            transform:
              translateY(12px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 940px) {
          .wallet-main-grid {
            grid-template-columns: 1fr;
          }

          .profile-wallet {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .wallet-shell {
            padding:
              10px 0 28px;
          }

          .wallet-topbar {
            padding: 0 2px;
          }

          .welcome-title {
            font-size: 21px;
          }

          .wallet-hero {
            padding: 20px;
            border-radius: 20px;
          }

          .wallet-actions {
            grid-template-columns:
              1fr;
            max-width: none;
          }

          .wallet-stats {
            grid-template-columns:
              1fr;
          }

          .wallet-stat {
            padding: 15px;
          }

          .transaction-item {
            grid-template-columns:
              39px minmax(0, 1fr);
          }

          .transaction-right {
            grid-column: 2;
            text-align: left;
          }
        }

        @media (max-width: 480px) {
          .wallet-balance {
            font-size: 38px;
          }

          .wallet-top-line {
            align-items: flex-start;
          }

          .wallet-status {
            font-size: 8px;
          }

          .wallet-stat strong {
            font-size: 19px;
          }
        }
      `}</style>

      <div className="wallet-shell">
        <div className="wallet-container">

          {/* ==================================================
             TOP BAR
          ================================================== */}
          <section className="wallet-topbar">
            <div>
              <h1 className="welcome-title">
                Hello, {firstName} 👋
              </h1>

              <p className="welcome-subtitle">
                Welcome back to your ElitePay wallet.
              </p>
            </div>

            <button
              className="avatar-button"
              onClick={() =>
                router.push("/profile")
              }
              aria-label="Open profile"
            >
              {initials}
            </button>
          </section>

          {/* ==================================================
             MAIN WALLET CARD
          ================================================== */}
          <section className="wallet-hero">
            <div className="wallet-hero-content">

              <div className="wallet-top-line">
                <span className="wallet-label">
                  ElitePay Wallet
                </span>

                <span className="wallet-status">
                  <span className="wallet-status-dot" />
                  Wallet Active
                </span>
              </div>

              <div className="wallet-balance-label">
                Available Balance
              </div>

              <div className="wallet-balance">
                {formatNaira(balance)}
              </div>

              <div className="wallet-account">
                Account holder:{" "}
                {user.fullName}
              </div>

              {/* WALLET ACTIONS */}
              <div className="wallet-actions">

                <button
                  className="wallet-action primary"
                  onClick={() =>
                    startQuick(
                      "/mine",
                      "Preparing Pulse Miner..."
                    )
                  }
                >
                  ⛏ Mine
                </button>

                <button
                  className="wallet-action"
                  disabled={restricted}
                  onClick={() =>
                    startQuick(
                      "/withdraw",
                      "Opening withdrawal..."
                    )
                  }
                >
                  ↗ Withdraw
                </button>

                <button
                  className="wallet-action"
                  disabled={restricted}
                  onClick={() =>
                    startQuick(
                      "/buy-code",
                      "Opening code purchase..."
                    )
                  }
                >
                  ＋ Buy Code
                </button>

              </div>
            </div>
          </section>

          {/* ==================================================
             WALLET STATISTICS
          ================================================== */}
          <section className="wallet-stats">

            <div className="wallet-stat">
              <div className="wallet-stat-header">
                <small>
                  Total Mined
                </small>

                <div className="wallet-stat-icon">
                  ⛏
                </div>
              </div>

              <strong>
                {formatNaira(
                  stats.totalMined
                )}
              </strong>
            </div>

            <div className="wallet-stat">
              <div className="wallet-stat-header">
                <small>
                  Total Withdrawn
                </small>

                <div className="wallet-stat-icon">
                  ↗
                </div>
              </div>

              <strong>
                {formatNaira(
                  stats.totalWithdrawn
                )}
              </strong>
            </div>

            <div className="wallet-stat">
              <div className="wallet-stat-header">
                <small>
                  Transactions
                </small>

                <div className="wallet-stat-icon">
                  ≡
                </div>
              </div>

              <strong>
                {stats.txCount}
              </strong>
            </div>

          </section>

          {/* ==================================================
             MAIN CONTENT
          ================================================== */}
          <section className="wallet-main-grid">

            {/* QUICK ACTIONS */}
            <div className="wallet-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Manage your wallet quickly.
                  </p>
                </div>
              </div>

              <div className="quick-actions">

                <button
                  className="quick-action"
                  onClick={() =>
                    startQuick(
                      "/mine",
                      "Preparing Pulse Miner..."
                    )
                  }
                >
                  <div className="quick-icon">
                    ⛏
                  </div>

                  <div className="quick-copy">
                    <strong>
                      Pulse Miner
                    </strong>

                    <span>
                      Start earning wallet rewards
                    </span>
                  </div>

                  <div className="quick-arrow">
                    →
                  </div>
                </button>

                <button
                  className="quick-action"
                  disabled={restricted}
                  onClick={() =>
                    startQuick(
                      "/withdraw",
                      "Opening withdrawal..."
                    )
                  }
                >
                  <div className="quick-icon">
                    ↗
                  </div>

                  <div className="quick-copy">
                    <strong>
                      Withdraw Funds
                    </strong>

                    <span>
                      Withdraw from your wallet
                    </span>
                  </div>

                  <div className="quick-arrow">
                    →
                  </div>
                </button>

                <button
                  className="quick-action"
                  disabled={restricted}
                  onClick={() =>
                    startQuick(
                      "/buy-code",
                      "Opening code purchase..."
                    )
                  }
                >
                  <div className="quick-icon">
                    +
                  </div>

                  <div className="quick-copy">
                    <strong>
                      Buy Withdrawal Code
                    </strong>

                    <span>
                      Purchase your activation code
                    </span>
                  </div>

                  <div className="quick-arrow">
                    →
                  </div>
                </button>

                <button
                  className="quick-action"
                  onClick={() =>
                    startQuick(
                      "/history",
                      "Loading transactions..."
                    )
                  }
                >
                  <div className="quick-icon">
                    ≡
                  </div>

                  <div className="quick-copy">
                    <strong>
                      Transaction History
                    </strong>

                    <span>
                      View all wallet activity
                    </span>
                  </div>

                  <div className="quick-arrow">
                    →
                  </div>
                </button>

              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="wallet-card">

              <div className="card-heading">
                <div>
                  <h2>
                    Recent Activity
                  </h2>

                  <p>
                    Your latest wallet transactions.
                  </p>
                </div>

                <button
                  className="view-link"
                  onClick={() =>
                    startQuick(
                      "/history",
                      "Loading transactions..."
                    )
                  }
                >
                  View all
                </button>
              </div>

              <div className="transaction-list">

                {previewTx.length === 0 && (
                  <div className="empty-transactions">
                    <div className="empty-icon">
                      ≡
                    </div>

                    <strong>
                      No transactions yet
                    </strong>

                    <span>
                      Your wallet activity will appear
                      here.
                    </span>
                  </div>
                )}

                {previewTx.map(
                  (item, index) => {
                    const transactionStatus =
                      getTransactionStatus(
                        item?.status
                      );

                    const transactionDate =
                      item?.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString()
                        : "Unknown date";

                    return (
                      <article
                        className="transaction-item"
                        key={
                          item?.id ||
                          item?.created_at ||
                          `${item?.type}-${index}`
                        }
                      >
                        <div className="transaction-icon">
                          {item?.type ===
                          "mine"
                            ? "⛏"
                            : item?.type ===
                              "withdraw" ||
                              item?.type ===
                                "withdraw_confirm"
                            ? "↗"
                            : "+"}
                        </div>

                        <div className="transaction-main">
                          <div className="transaction-title">
                            {getTransactionTitle(
                              item
                            )}
                          </div>

                          <div className="transaction-date">
                            {transactionDate}
                          </div>
                        </div>

                        <div className="transaction-right">
                          <div className="transaction-amount">
                            {formatNaira(
                              item?.amount ||
                                0
                            )}
                          </div>

                          <span
                            className={`transaction-status ${transactionStatus.className}`}
                          >
                            {
                              transactionStatus.label
                            }
                          </span>
                        </div>
                      </article>
                    );
                  }
                )}

              </div>
            </div>

          </section>

          {/* ==================================================
             PROFILE + REFERRAL
          ================================================== */}
          <section className="profile-wallet">

            <div className="wallet-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Wallet Profile
                  </h2>

                  <p>
                    Your account information.
                  </p>
                </div>

                <button
                  className="view-link"
                  onClick={() =>
                    router.push("/profile")
                  }
                >
                  Edit
                </button>
              </div>

              <div className="profile-mini">
                <div className="profile-avatar">
                  {initials}
                </div>

                <div>
                  <strong>
                    {user.fullName}
                  </strong>

                  <span>
                    {user.phone}
                  </span>
                </div>
              </div>

              <div className="profile-details">

                <div className="profile-detail">
                  <span>
                    Plan
                  </span>

                  <strong>
                    {user.plan ||
                      "Pulse Miner"}
                  </strong>
                </div>

                <div className="profile-detail">
                  <span>
                    Referral
                  </span>

                  <strong>
                    {user.referral ||
                      "Not set"}
                  </strong>
                </div>

                <div className="profile-detail">
                  <span>
                    Transactions
                  </span>

                  <strong>
                    {stats.txCount}
                  </strong>
                </div>

              </div>
            </div>

            <div className="referral-box">
              <h3>
                Invite & Grow
              </h3>

              <p>
                Share your ElitePay referral link
                with friends and grow your network.
              </p>

              <button
                className="referral-button"
                onClick={copyReferral}
              >
                Copy Referral Link
              </button>

              <button
                className="referral-button"
                style={{
                  marginTop: 7,
                  background: "#087a56",
                  color: "#ffffff",
                  borderColor: "#087a56",
                }}
                onClick={shareWallet}
              >
                Share ElitePay
              </button>
            </div>

          </section>

        </div>
      </div>

      {/* ==================================================
         RESTRICTION MODAL
      ================================================== */}
      {restricted && (
        <div
          className="restriction-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="restriction-card">

            <div className="restriction-icon">
              !
            </div>

            <h2>
              Wallet Access Restricted
            </h2>

            <p>
              Dear{" "}
              <strong>
                {user.fullName}
              </strong>
              , some wallet features are currently
              restricted. Activate your account to
              continue using ElitePay.
            </p>

            <ul className="restriction-list">

              <li>
                <span className="restriction-number">
                  1
                </span>

                <div>
                  Accessing the website again after
                  a completed withdrawal.
                </div>
              </li>

              <li>
                <span className="restriction-number">
                  2
                </span>

                <div>
                  Incorrect account name or phone
                  number on a withdrawal request.
                </div>
              </li>

              <li>
                <span className="restriction-number">
                  3
                </span>

                <div>
                  Making multiple withdrawal requests
                  at the same time.
                </div>
              </li>

              <li>
                <span className="restriction-number">
                  4
                </span>

                <div>
                  Using one activation code on a
                  different account.
                </div>
              </li>

            </ul>

            <button
              className="restriction-button"
              onClick={() =>
                router.push("/activation")
              }
            >
              Activate Account
            </button>

          </div>
        </div>
      )}

      {/* ==================================================
         INTRO MODAL
      ================================================== */}
      {showIntro && (
        <div
          className="intro-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="intro-modal">

            <div className="intro-top">

              <div className="intro-brand">
                <div className="intro-icon">
                  {slides[
                    introIndex
                  ].icon}
                </div>

                <div>
                  <div className="intro-title">
                    {
                      slides[
                        introIndex
                      ].title
                    }
                  </div>

                  <div className="intro-subtitle">
                    {
                      slides[
                        introIndex
                      ].subtitle
                    }
                  </div>
                </div>
              </div>

              <button
                className="intro-skip"
                onClick={() =>
                  setShowIntro(false)
                }
              >
                Skip
              </button>

            </div>

            <div className="intro-body">
              {
                slides[
                  introIndex
                ].body
              }
            </div>

            <div className="intro-footer">

              <div className="intro-dots">
                {slides.map(
                  (slide, index) => (
                    <span
                      key={slide.title}
                      className={`intro-dot ${
                        index ===
                        introIndex
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setIntroIndex(index)
                      }
                    />
                  )
                )}
              </div>

              <div className="intro-controls">

                {introIndex > 0 && (
                  <button
                    className="intro-skip"
                    onClick={() =>
                      setIntroIndex(
                        (index) =>
                          index - 1
                      )
                    }
                  >
                    Back
                  </button>
                )}

                <button
                  className="intro-button"
                  onClick={() => {
                    if (
                      introIndex <
                      slides.length - 1
                    ) {
                      setIntroIndex(
                        (index) =>
                          index + 1
                      );
                    } else {
                      setShowIntro(
                        false
                      );

                      setShowWelcome(
                        true
                      );

                      setTimeout(
                        () =>
                          setShowWelcome(
                            false
                          ),
                        2200
                      );
                    }
                  }}
                >
                  {introIndex ===
                  slides.length - 1
                    ? "Get Started"
                    : "Next"}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==================================================
         WELCOME POPUP
      ================================================== */}
      {showWelcome && (
        <div
          className="welcome-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="welcome-box">

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
              }}
            >
              <div className="welcome-avatar">
                ✓
              </div>

              <div>
                <div
                  style={{
                    color: "#102033",
                    fontSize: 15,
                    fontWeight: 950,
                  }}
                >
                  Welcome, {firstName}
                </div>

                <div
                  style={{
                    marginTop: 3,
                    color: "#94a3b8",
                    fontSize: 10,
                  }}
                >
                  Your wallet is ready.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================
         QUICK LOADING OVERLAY
      ================================================== */}
      {loading && (
        <div
          className="dashboard-loading"
          role="status"
          aria-live="polite"
        >
          <div className="loading-card">

            <div className="loader-ring" />

            <div>
              <strong>
                {loadingMessage}
              </strong>

              <span>
                Preparing your secure wallet session...
              </span>
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}
