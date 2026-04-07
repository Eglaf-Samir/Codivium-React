import { useState } from "react";
import Header from "../components/Header";
import usePageMeta from "../hooks/usePageMeta";

function Pricing() {
  usePageMeta("pricing");

  const BASE = {
    week: 15,
    month: 75,
    year: 675,
  };

  const DISCOUNT_FACTOR = 0.4;

  const [mode, setMode] = useState("month");

  const base = BASE[mode];
  const hasDiscount = mode !== "week";
  const finalPrice = hasDiscount ? base * DISCOUNT_FACTOR : base;

  const getPer = () => {
    if (mode === "week") return "/ week";
    if (mode === "month") return "/ month";
    return "/ year";
  };

  const getNote = () => {
    if (mode === "week") return "Week-only access. Ends after 7 days.";
    if (mode === "month") return "Renews automatically every month.";
    return "Renews automatically every year.";
  };

  const getButtonText = () => {
    if (mode === "week") return "Select Week";
    if (mode === "month") return "Select Monthly";
    return "Select Annual";
  };

  const handleSelect = () => {
    window.location.href = `/join?plan=${mode}`;
  };

  return (
    <>
      <Header />

      <main className="wrap" id="mainContent">
        <section className="container">
          <header className="top">
            <div className="kicker">Pricing</div>
            <h1>Choose your subscription</h1>
            <p className="sub">One plan. Full access to everything.</p>
          </header>

          <div className="grid">
            <article className="card card-single">
              {/* PLAN */}
              <div className="plan">
                <h2>Codivium</h2>
                <span className="tag">
                  {mode === "week"
                    ? "Week only"
                    : mode === "year"
                      ? "Best value"
                      : "Auto-renew"}
                </span>
              </div>

              {/* BILLING */}
              <div className="billing">
                {["week", "month", "year"].map((type) => (
                  <label key={type} className="bill-pill">
                    <input
                      type="radio"
                      name="billing"
                      value={type}
                      checked={mode === type}
                      onChange={() => setMode(type)}
                    />
                    <span>
                      {type === "week"
                        ? "Week Only"
                        : type === "month"
                          ? "Monthly"
                          : "Annual"}
                    </span>
                  </label>
                ))}
              </div>

              {/* PRICE */}
              <div className="price">
                <div className="amounts">
                  {hasDiscount && (
                    <div className="amount original">${Math.round(base)}</div>
                  )}

                  <div className="amount">${Math.round(finalPrice)}</div>
                </div>

                <div className="per">{getPer()}</div>
              </div>

              {/* DISCOUNT */}
              {hasDiscount && (
                <div className="discount-banner">
                  <span className="discount-badge">Discount</span>
                  <span>Launch offer — 60% off.</span>
                </div>
              )}

              {/* NOTE */}
              <div className="note">{getNote()}</div>

              {/* FOOT */}
              <div className="fineprint">
                <span>
                  {mode === "week"
                    ? "No cancellation needed"
                    : "Cancel anytime"}
                </span>
                <span className="sep">•</span>
                <span>Instant access</span>
              </div>
              <ul aria-label="Features included" className="features">
                <li>
                  <span aria-hidden="true" className="check">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        stroke-linejoin="round"
                        strokeWidth="2.4"
                      ></path>
                    </svg>
                  </span>
                  Full-spectrum access: interview questions, micro-challenges,
                  and MCQs
                </li>
                <li>
                  <span aria-hidden="true" className="check">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        stroke-linejoin="round"
                        strokeWidth="2.4"
                      ></path>
                    </svg>
                  </span>
                  Mental model training designed for elite problem-solvers
                </li>
                <li>
                  <span aria-hidden="true" className="check">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        stroke-linejoin="round"
                        strokeWidth="2.4"
                      ></path>
                    </svg>
                  </span>
                  Precision gap diagnosis — so you never practise blindly
                </li>
                <li>
                  <span aria-hidden="true" className="check">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        stroke-linejoin="round"
                        strokeWidth="2.4"
                      ></path>
                    </svg>
                  </span>
                  Market-leading analytics that turns effort into measurable
                  progress
                </li>
                <li>
                  <span aria-hidden="true" className="check">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        stroke-linejoin="round"
                        strokeWidth="2.4"
                      ></path>
                    </svg>
                  </span>
                  Immediate, deliberate-practice-driven feedback after every
                  session
                </li>
              </ul>
              {/* BUTTON */}

              <button
                className="select-btn select-btn-center"
                onClick={handleSelect}
              >
                {" "}
                {getButtonText()}
              </button>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

export default Pricing;
