import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useState } from "react";

const features = [
  {
    icon: "₦",
    title: "Digital Wallet",
    text: "View your available balance, wallet activity and account information from one clean dashboard.",
  },
  {
    icon: "⛏",
    title: "Pulse Miner",
    text: "Open the mining center, monitor your session and claim available rewards directly to your wallet.",
  },
  {
    icon: "↗",
    title: "Easy Withdrawals",
    text: "Choose your bank account, enter your amount and review your withdrawal before confirming.",
  },
  {
    icon: "⌁",
    title: "Transaction History",
    text: "Keep track of mining rewards, withdrawals, activations and other wallet activity.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    text: "Register once with your name and phone number.",
  },
  {
    number: "02",
    title: "Use your wallet",
    text: "Open Pulse Miner and manage your available balance.",
  },
  {
    number: "03",
    title: "Withdraw securely",
    text: "Complete the required withdrawal steps and send funds to your bank.",
  },
];

const trustItems = [
  {
    title: "Simple wallet flow",
    text: "Important actions are kept clear and easy to find.",
  },
  {
    title: "Account controls",
    text: "Activation and withdrawal checks help control sensitive wallet actions.",
  },
  {
    title: "Activity records",
    text: "Keep a readable history of your wallet transactions.",
  },
];

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Preparing secure session..."
  );

  const goWithLoader = (
    path,
    message = "Preparing secure session..."
  ) => {
    if (loading) return;

    setLoadingMessage(message);
    setLoading(true);

    setTimeout(() => {
      setLoadingMessage(
        "Opening ElitePay services..."
      );
    }, 450);

    setTimeout(() => {
      setLoadingMessage(
        "Securing your wallet session..."
      );
    }, 900);

    setTimeout(() => {
      router.push(path);
    }, 1300);
  };

  return (
    <Layout title="ElitePay Wallet">
      <style jsx>{`
        .home-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 18px;
          padding: 8px 0 32px;
        }

        /* ==================================================
           HERO
        ================================================== */

        .hero {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns:
            minmax(0, 1.15fr)
            minmax(320px, 0.85fr);
          gap: 28px;
          align-items: center;
          padding: 34px;
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 82% 8%,
              rgba(
                25,
                185,
                167,
                0.22
              ),
              transparent 27%
            ),
            radial-gradient(
              circle at 0% 100%,
              rgba(
                15,
                159,
                110,
                0.09
              ),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #ffffff,
              #f7fbfd
            );
          border: 1px solid #dfe8f1;
          box-shadow:
            0 24px 65px
              rgba(
                16,
                32,
                51,
                0.08
              );
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border-radius: 999px;
          background: #eaf9f2;
          border: 1px solid #d4eee4;
          color: #087a56;
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0f9f6e;
          box-shadow:
            0 0 0 4px
              rgba(
                15,
                159,
                110,
                0.08
              );
        }

        .hero h1 {
          max-width: 720px;
          margin: 15px 0 0;
          color: #102033;
          font-size: clamp(
            35px,
            5.5vw,
            60px
          );
          line-height: 0.99;
          letter-spacing: -0.055em;
          font-weight: 950;
        }

        .hero-description {
          max-width: 620px;
          margin: 16px 0 0;
          color: #5f7184;
          font-size: 14px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 21px;
        }

        .hero-proof {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          max-width: 600px;
          margin-top: 22px;
        }

        .proof {
          padding: 11px 12px;
          border-radius: 11px;
          background: rgba(
            255,
            255,
            255,
            0.8
          );
          border: 1px solid #e0e9f0;
        }

        .proof strong {
          display: block;
          color: #102033;
          font-size: 13px;
          font-weight: 950;
        }

        .proof span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 9px;
          line-height: 1.3;
        }

        /* ==================================================
           HERO VISUAL
        ================================================== */

        .hero-visual {
          position: relative;
          min-height: 350px;
          display: grid;
          align-content: center;
          gap: 12px;
        }

        .brand-showcase {
          display: grid;
          place-items: center;
          min-height: 330px;
          border-radius: 21px;
          background:
            radial-gradient(
              circle at 50% 35%,
              rgba(
                15,
                159,
                110,
                0.22
              ),
              transparent 48%
            ),
            linear-gradient(
              135deg,
              #102033,
              #0d3f32
            );
          box-shadow:
            0 26px 60px
              rgba(
                16,
                32,
                51,
                0.18
              );
        }

        .brand-showcase::before {
          content: "";
          position: absolute;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.08
            );
          animation:
            pulseRing 4s ease-in-out infinite;
        }

        .brand-showcase img {
          position: relative;
          z-index: 2;
          width: min(
            250px,
            78%
          );
          height: auto;
          object-fit: contain;
          filter:
            drop-shadow(
              0 18px 26px
                rgba(
                  0,
                  0,
                  0,
                  0.26
                )
            );
        }

        /* ==================================================
           SECTION
        ================================================== */

        .section-card {
          padding: 20px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #dfe8f1;
          box-shadow:
            0 12px 34px
              rgba(
                16,
                32,
                51,
                0.05
              );
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 15px;
          margin-bottom: 14px;
        }

        .section-heading h2 {
          margin: 0;
          color: #102033;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .section-heading p {
          max-width: 570px;
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.5;
        }

        /* ==================================================
           FEATURE GRID
        ================================================== */

        .feature-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 9px;
        }

        .feature-card {
          min-height: 165px;
          padding: 15px;
          border-radius: 13px;
          background: #fbfdff;
          border: 1px solid #e3ebf2;
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            background 0.16s ease;
        }

        .feature-card:hover {
          transform: translateY(
            -2px
          );
          border-color: #cde5dc;
          background: #ffffff;
        }

        .feature-icon {
          width: 37px;
          height: 37px;
          display: grid;
          place-items: center;
          margin-bottom: 11px;
          border-radius: 10px;
          background: #eaf9f2;
          color: #087a56;
          font-size: 14px;
          font-weight: 950;
        }

        .feature-card h3 {
          margin: 0;
          color: #102033;
          font-size: 12px;
          font-weight: 950;
        }

        .feature-card p {
          margin: 6px 0 0;
          color: #7c8c9d;
          font-size: 9px;
          line-height: 1.6;
        }

        /* ==================================================
           PROCESS
        ================================================== */

        .process-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .process-card {
          position: relative;
          padding: 17px;
          border-radius: 13px;
          border: 1px solid #e1e9f0;
          background: #ffffff;
        }

        .process-number {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          margin-bottom: 13px;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #0f9f6e,
              #18b5a0
            );
          color: #ffffff;
          font-size: 9px;
          font-weight: 950;
        }

        .process-card h3 {
          margin: 0;
          color: #102033;
          font-size: 13px;
          font-weight: 950;
        }

        .process-card p {
          margin: 6px 0 0;
          color: #8997a6;
          font-size: 9px;
          line-height: 1.55;
        }

        .process-line {
          position: absolute;
          top: 35px;
          right: -9px;
          width: 18px;
          height: 1px;
          background: #d7e2ea;
        }

        .process-card:last-child
          .process-line {
          display: none;
        }

        /* ==================================================
           TRUST
        ================================================== */

        .trust-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .trust-card {
          padding: 15px;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #f7fbf9,
              #f8fbff
            );
          border: 1px solid #dce9e4;
        }

        .trust-card h3 {
          margin: 0;
          color: #102033;
          font-size: 11px;
          font-weight: 950;
        }

        .trust-card p {
          margin: 5px 0 0;
          color: #8795a4;
          font-size: 9px;
          line-height: 1.5;
        }

        /* ==================================================
           CTA
        ================================================== */

        .cta {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 17px;
          padding: 23px;
          border-radius: 18px;
          color: #ffffff;
          background:
            radial-gradient(
              circle at 95% 0%,
              rgba(
                54,
                216,
                178,
                0.22
              ),
              transparent 28%
            ),
            linear-gradient(
              135deg,
              #102033,
              #0d5b45
            );
        }

        .cta h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 950;
        }

        .cta p {
          max-width: 600px;
          margin: 5px 0 0;
          color: rgba(
            255,
            255,
            255,
            0.68
          );
          font-size: 10px;
          line-height: 1.5;
        }

        .cta-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .cta-actions .btnGhost {
          color: #ffffff;
          background: rgba(
            255,
            255,
            255,
            0.09
          );
          border-color:
            rgba(
              255,
              255,
              255,
              0.17
            );
        }

        /* ==================================================
           LOADING
        ================================================== */

        .loading-overlay {
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
              0.58
            );
          backdrop-filter: blur(8px);
        }

        .loading-card {
          display: flex;
          align-items: center;
          gap: 11px;
          width: min(360px, 100%);
          padding: 18px;
          border-radius: 15px;
          background: #ffffff;
          border: 1px solid #e0e8ef;
          box-shadow:
            0 28px 80px
              rgba(
                15,
                23,
                42,
                0.2
              );
        }

        .loading-spinner {
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 3px solid #dce7ef;
          border-top-color: #0f9f6e;
          animation:
            spin 0.75s linear infinite;
        }

        .loading-card strong {
          display: block;
          color: #102033;
          font-size: 11px;
          font-weight: 950;
        }

        .loading-card span {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(
              360deg
            );
          }
        }

        @keyframes pulseRing {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.45;
          }

          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 950px) {
          .hero {
            grid-template-columns:
              1fr;
          }

          .feature-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .hero-visual {
            min-height: auto;
          }
        }

        @media (max-width: 700px) {
          .home-shell {
            padding:
              4px 0 26px;
          }

          .hero {
            padding: 20px;
            border-radius: 19px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero-proof {
            grid-template-columns:
              1fr;
          }

          .feature-grid,
          .process-grid,
          .trust-grid {
            grid-template-columns:
              1fr;
          }

          .section-card {
            padding: 16px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .process-line {
            display: none;
          }

          .cta {
            align-items: flex-start;
            flex-direction: column;
            padding: 19px;
          }

          .cta-actions {
            width: 100%;
          }

          .cta-actions button {
            flex: 1;
          }

          .brand-showcase {
            min-height: 270px;
          }
        }
      `}</style>

      <div className="home-shell">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="hero">
          <div className="hero-content">

            <div className="eyebrow">
              <span className="eyebrow-dot" />
              ElitePay Digital Wallet
            </div>

            <h1>
              Your wallet.
              <br />
              Your rewards.
              <br />
              One simple flow.
            </h1>

            <p className="hero-description">
              ElitePay brings your wallet balance,
              Pulse Miner rewards, withdrawals and
              transaction history together in one
              simple account experience.
            </p>

            <div className="hero-actions">

              <button
                className="btn"
                type="button"
                onClick={() =>
                  goWithLoader(
                    "/register",
                    "Creating your ElitePay account..."
                  )
                }
              >
                Create Account
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() =>
                  goWithLoader(
                    "/login",
                    "Opening secure login..."
                  )
                }
              >
                Login
              </button>

            </div>

            <div className="hero-proof">

              <div className="proof">
                <strong>
                  Wallet
                </strong>

                <span>
                  Balance and activity in one place.
                </span>
              </div>

              <div className="proof">
                <strong>
                  Pulse Miner
                </strong>

                <span>
                  Run and claim available rewards.
                </span>
              </div>

              <div className="proof">
                <strong>
                  Withdraw
                </strong>

                <span>
                  Move available funds to your bank.
                </span>
              </div>

            </div>

          </div>

          {/* HERO VISUAL */}

          <div className="hero-visual">

            <div className="brand-showcase">
              <img
                src="/elitepay-logo.png"
                alt="ElitePay logo"
              />
            </div>

          </div>
        </section>

        {/* ==================================================
            FEATURES
        ================================================== */}

        <section className="section-card">

          <div className="section-heading">

            <div>
              <h2>
                Everything important in one wallet
              </h2>

              <p>
                The main ElitePay tools are designed
                around the actions users actually need.
              </p>
            </div>

            <button
              className="btnGhost"
              type="button"
              onClick={() =>
                goWithLoader(
                  "/login",
                  "Opening your wallet..."
                )
              }
            >
              Open Wallet
            </button>

          </div>

          <div className="feature-grid">

            {features.map(
              (feature) => (
                <article
                  className="feature-card"
                  key={feature.title}
                >
                  <div className="feature-icon">
                    {feature.icon}
                  </div>

                  <h3>
                    {feature.title}
                  </h3>

                  <p>
                    {feature.text}
                  </p>
                </article>
              )
            )}

          </div>

        </section>

        {/* ==================================================
            HOW IT WORKS
        ================================================== */}

        <section className="section-card">

          <div className="section-heading">

            <div>
              <h2>
                How ElitePay works
              </h2>

              <p>
                A straightforward flow from account
                creation to wallet management.
              </p>
            </div>

          </div>

          <div className="process-grid">

            {steps.map(
              (
                step,
                index
              ) => (
                <article
                  className="process-card"
                  key={step.number}
                >
                  <div className="process-number">
                    {step.number}
                  </div>

                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.text}
                  </p>

                  {index <
                    steps.length - 1 && (
                    <span className="process-line" />
                  )}

                </article>
              )
            )}

          </div>

        </section>

        {/* ==================================================
            TRUST
        ================================================== */}

        <section className="section-card">

          <div className="section-heading">

            <div>
              <h2>
                Built around clarity and control
              </h2>

              <p>
                Users can quickly see their wallet
                information and understand what happens
                before important actions.
              </p>
            </div>

          </div>

          <div className="trust-grid">

            {trustItems.map(
              (item) => (
                <article
                  className="trust-card"
                  key={item.title}
                >
                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.text}
                  </p>
                </article>
              )
            )}

          </div>

        </section>

        {/* ==================================================
            CTA
        ================================================== */}

        <section className="cta">

          <div>
            <h2>
              Ready to open your wallet?
            </h2>

            <p>
              Create your ElitePay account or log in
              and continue from your wallet dashboard.
            </p>
          </div>

          <div className="cta-actions">

            <button
              className="btn"
              type="button"
              onClick={() =>
                goWithLoader(
                  "/register",
                  "Creating your ElitePay account..."
                )
              }
            >
              Get Started
            </button>

            <button
              className="btnGhost"
              type="button"
              onClick={() =>
                goWithLoader(
                  "/login",
                  "Opening secure login..."
                )
              }
            >
              Login
            </button>

          </div>

        </section>

      </div>

      {/* ====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div
          className="loading-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="loading-card">

            <div className="loading-spinner" />

            <div>
              <strong>
                {loadingMessage}
              </strong>

              <span>
                Preparing your secure ElitePay session...
              </span>
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}