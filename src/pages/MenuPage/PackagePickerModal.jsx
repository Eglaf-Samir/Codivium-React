// PackagePickerModal.jsx
// Shown when a free-package user clicks a locked (non-free) question. Renders the
// paid packages with the SAME info as the Pricing page — billing-period tabs
// (week / month / year), discount, features — and starts a Stripe checkout.
// Self-contained inline styles because the Pricing page CSS is scoped to
// body[data-page="pricing"] and isn't available on the menu page.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getpackageslist,
  createcheckout,
} from "../../api/pricepackage/apipackage";

const BILLING_ORDER = ["week", "month", "year"];
const PERIOD_LABELS = { week: "Week Only", month: "Monthly", year: "Annual" };
const PER_LABELS = { week: "/ week", month: "/ month", year: "/ year" };
const NOTE_LABELS = {
  week: "Week-only access. Ends after 7 days.",
  month: "Renews automatically at the end of each month.",
  year: "Renews automatically at the end of each year.",
};
const SELECT_LABELS = {
  week: "Select Week",
  month: "Select Monthly",
  year: "Select Annual",
};

const FEATURES = [
  "Full-spectrum access: interview questions, micro-challenges, and MCQs",
  "Mental model training designed for elite problem-solvers",
  "Precision gap diagnosis — so you never practise blindly",
  "Market-leading analytics that turns effort into measurable progress",
  "Immediate, deliberate-practice-driven feedback after every session",
];

function computeFinalPrice(price) {
  const base = Number(price.basePrice ?? price.price ?? 0);
  const type = price.discountType;
  const value = Number(price.discountValue || 0);
  if (type === "Percent" && value > 0) return Math.max(0, base * (1 - value / 100));
  if (type === "Amount" && value > 0) return Math.max(0, base - value);
  return base;
}

function ModalPackageCard({ pkg }) {
  const [purchasing, setPurchasing] = useState(false);

  const priceMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(pkg.packagePriceList)) return map;
    pkg.packagePriceList.forEach((p) => {
      if (!p.isdeleted && p.billingPeriod) map[p.billingPeriod] = p;
    });
    return map;
  }, [pkg]);

  const availablePeriods = useMemo(
    () => BILLING_ORDER.filter((b) => priceMap[b]),
    [priceMap],
  );

  const initialMode = useMemo(() => {
    const def = pkg.packagePriceList?.find(
      (p) => p.isDefault && !p.isdeleted && BILLING_ORDER.includes(p.billingPeriod),
    );
    if (def) return def.billingPeriod;
    return availablePeriods[0] || "month";
  }, [pkg, availablePeriods]);

  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    if (availablePeriods.length === 0) return;
    if (!availablePeriods.includes(mode)) setMode(initialMode);
  }, [availablePeriods, mode, initialMode]);

  const currentPrice = priceMap[mode];
  if (!currentPrice) return null;

  const base = Number(currentPrice.basePrice ?? currentPrice.price ?? 0);
  const finalPrice = computeFinalPrice(currentPrice);
  const hasDiscount = finalPrice < base;
  const currencySymbol =
    currentPrice.currencyothername || currentPrice.currencyname || "";

  const handleSelect = async () => {
    if (purchasing) return;
    const userId = localStorage.getItem("Userid");
    if (!userId) return;
    setPurchasing(true);
    try {
      const res = await createcheckout({
        userID: userId,
        packagePriceID: currentPrice.id,
        isautorenewal: false,
        packageID: pkg.id,
      });
      if (res?.status === 200 && res.data?.responseUrl) {
        window.location.replace(res.data.responseUrl);
        return;
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid rgba(216,178,104,0.35)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>{pkg.packageName}</h3>
        <span
          style={{
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 999,
            border: "1px solid rgba(216,178,104,0.5)",
            color: "var(--color-accent, #d8b268)",
          }}
        >
          {mode === "year" ? "Best value" : mode === "month" ? "Auto-renew" : "Week only"}
        </span>
      </div>

      {/* Billing-period tabs */}
      {availablePeriods.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {availablePeriods.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMode(type)}
              style={{
                flex: 1,
                minWidth: 90,
                padding: "8px 10px",
                borderRadius: 9,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: mode === type ? 700 : 500,
                border:
                  mode === type
                    ? "1px solid var(--color-accent, #d8b268)"
                    : "1px solid rgba(255,255,255,0.18)",
                background:
                  mode === type ? "rgba(216,178,104,0.18)" : "transparent",
                color: "inherit",
              }}
            >
              {PERIOD_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {/* Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {hasDiscount && (
          <span style={{ textDecoration: "line-through", opacity: 0.6, fontSize: 16 }}>
            {currencySymbol}
            {Math.round(base)}
          </span>
        )}
        <span style={{ fontSize: 30, fontWeight: 800 }}>
          {currencySymbol}
          {Math.round(finalPrice)}
        </span>
        <span style={{ fontSize: 13, opacity: 0.7 }}>{PER_LABELS[mode]}</span>
      </div>

      {hasDiscount && (
        <div style={{ fontSize: 12, color: "var(--color-accent, #d8b268)" }}>
          Launch offer —{" "}
          {currentPrice.discountType === "Percent"
            ? `${currentPrice.discountValue}% off`
            : `${currencySymbol}${currentPrice.discountValue} off`}
        </div>
      )}

      <div style={{ fontSize: 12, opacity: 0.75 }}>{NOTE_LABELS[mode]}</div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {FEATURES.map((f, i) => (
          <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, opacity: 0.9 }}>
            <span style={{ color: "var(--color-accent, #d8b268)", fontWeight: 800 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={purchasing}
        onClick={handleSelect}
        style={{
          marginTop: "auto",
          background: "linear-gradient(180deg, var(--color-accent, #d8b268), #b8924a)",
          color: "#1a1408",
          border: "none",
          borderRadius: 10,
          padding: "12px 16px",
          fontWeight: 700,
          cursor: purchasing ? "default" : "pointer",
        }}
      >
        {purchasing ? "Redirecting…" : SELECT_LABELS[mode]}
      </button>
    </div>
  );
}

export default function PackagePickerModal({ open, onClose }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await getpackageslist();
      if (cancelled) return;
      if (res?.status === 200 && Array.isArray(res.data)) setPackages(res.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Lock body scroll while the modal is open so the page behind doesn't move.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  // Hide the free/default package — only paid plans unlock locked questions.
  const visible = packages.filter((p) => {
    if (!Array.isArray(p.packagePriceList)) return false;
    const active = p.packagePriceList.filter((pr) => !pr.isdeleted);
    if (active.length === 0) return false;
    const isFreePkg = active.every(
      (pr) => (Number(pr.basePrice) || 0) === 0 && (Number(pr.price) || 0) === 0,
    );
    return !isFreePkg;
  });

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        // Match the Welcome-back (.fb-overlay) insets so the popup centers in the
        // content column: top = topbar + gap, left = current sidebar width.
        padding:
          "calc(var(--topbar-h, 82px) + 20px) 22px 22px calc(var(--content-left, var(--sidebar-w, 264px)) + 22px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-bg-elevated, #15151b)",
          color: "var(--color-text-primary, #eee)",
          borderRadius: 16,
          maxWidth: 900,
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Unlock this question</h2>
            <p style={{ margin: "6px 0 0", opacity: 0.8, fontSize: 14 }}>
              This question isn’t part of the free plan. Choose a plan to get full access.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: "inherit", fontSize: 26, cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {loading && <div style={{ padding: 20 }}>Loading plans…</div>}
        {!loading && visible.length === 0 && (
          <div style={{ padding: 20, opacity: 0.8 }}>No packages available right now.</div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {visible.map((pkg) => (
            <ModalPackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
