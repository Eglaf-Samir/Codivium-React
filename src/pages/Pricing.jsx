import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import {
  getpackageslist,
  createcheckout,
} from "../api/pricepackage/apipackage";

const BILLING_ORDER = ["week", "month", "year"];

const PERIOD_LABELS = {
  week: "Week Only",
  month: "Monthly",
  year: "Annual",
};

const PER_LABELS = {
  week: "/ week",
  month: "/ month",
  year: "/ year",
};

const NOTE_LABELS = {
  week: "Week-only access. Ends after 7 days.",
  month: "Renews automatically every month.",
  year: "Renews automatically every year.",
};

const SELECT_LABELS = {
  week: "Select Week",
  month: "Select Monthly",
  year: "Select Annual",
};

const TAG_LABELS = {
  week: "Week only",
  month: "Auto-renew",
  year: "Best value",
};

function computeFinalPrice(price) {
  const base = Number(price.basePrice ?? price.price ?? 0);
  const type = price.discountType;
  const value = Number(price.discountValue || 0);

  if (type === "Percent" && value > 0) {
    return Math.max(0, base * (1 - value / 100));
  }
  if (type === "Amount" && value > 0) {
    return Math.max(0, base - value);
  }
  return base;
}

function CheckIcon() {
  return (
    <span aria-hidden="true" className="check">
      <svg fill="none" viewBox="0 0 24 24">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        ></path>
      </svg>
    </span>
  );
}

function PackageCard({ pkg }) {
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);

  const priceMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(pkg.packagePriceList)) return map;
    pkg.packagePriceList.forEach((p) => {
      if (!p.isdeleted && p.billingPeriod) {
        map[p.billingPeriod] = p;
      }
    });
    return map;
  }, [pkg]);

  const availablePeriods = useMemo(
    () => BILLING_ORDER.filter((b) => priceMap[b]),
    [priceMap]
  );

  const initialMode = useMemo(() => {
    const def = pkg.packagePriceList?.find(
      (p) => p.isDefault && !p.isdeleted && BILLING_ORDER.includes(p.billingPeriod)
    );
    if (def) return def.billingPeriod;
    return availablePeriods[0] || "month";
  }, [pkg, availablePeriods]);

  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (availablePeriods.length === 0) return;
    if (!availablePeriods.includes(mode)) {
      setMode(initialMode);
    }
  }, [availablePeriods, mode, initialMode]);

  const currentPrice = priceMap[mode];
  if (!currentPrice) return null;

  const base = Number(currentPrice.basePrice ?? currentPrice.price ?? 0);
  const finalPrice = computeFinalPrice(currentPrice);
  const hasDiscount = finalPrice < base;
  const currencySymbol =
    currentPrice.currencyothername || currentPrice.currencyname || "";
  const isFree = base === 0 && finalPrice === 0;

  let discountText = "";
  if (hasDiscount) {
    if (currentPrice.discountType === "Percent") {
      discountText = `Launch offer — ${currentPrice.discountValue}% off.`;
    } else if (currentPrice.discountType === "Amount") {
      discountText = `Launch offer — ${currencySymbol}${currentPrice.discountValue} off.`;
    } else {
      discountText = "Launch offer.";
    }
  }

  const showError = () => {
    Swal.fire({
      title: "Error!",
      text: "purchase package submitted filed!",
      icon: "error",
      width: "400px",
      padding: "3em",
      customClass: {
        confirmButton: "custom-confirm-button",
        cancelButton: "custom-cancel-button",
        title: "custom-title",
        content: "custom-content",
      },
    });
  };

  const handleSelect = async () => {
    if (purchasing) return;

    const userId = localStorage.getItem("Userid");

    if (!userId) {
      const result = await Swal.fire({
        title: "Are you sure purchase package ?",
        text: "Please click OK to log in and purchase package",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "OK !",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      });
      if (result.isConfirmed) {
        localStorage.clear();
        localStorage.setItem("gotologintoPrice", "true");
        navigate("/login");
      }
      return;
    }

    const body = {
      userID: userId,
      packagePriceID: currentPrice.id,
      isautorenewal: false,
      packageID: pkg.id,
    };

    try {
      setPurchasing(true);
      const res = await createcheckout(body);
      if (res && res.status === 200 && res.data) {
        if (res.data.responseUrl) {
          window.location.replace(res.data.responseUrl);
          return;
        }
        showError();
      } else if (res && res.status === 401) {
        localStorage.setItem("Userid", "");
        localStorage.setItem("LoginToken", "");
        localStorage.setItem("UserRoleName", "");
        localStorage.setItem("gotologintoPrice", "true");
        localStorage.clear();
        navigate("/login");
      } else {
        showError();
      }
    } catch (e) {
      if (e && e.status === 401) {
        localStorage.setItem("gotologintoPrice", "true");
        localStorage.clear();
        navigate("/login");
        return;
      }
      showError();
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <article className="card card-single">
      {/* PLAN */}
      <div className="plan">
        <h2>{pkg.packageName}</h2>
        <span className="tag">{isFree ? "Free" : TAG_LABELS[mode]}</span>
      </div>

      {/* BILLING */}
      {availablePeriods.length > 1 && (
        <div className="billing">
          {availablePeriods.map((type) => (
            <label key={type} className="bill-pill">
              <input
                type="radio"
                name={`billing-${pkg.id}`}
                value={type}
                checked={mode === type}
                onChange={() => setMode(type)}
              />
              <span>{PERIOD_LABELS[type]}</span>
            </label>
          ))}
        </div>
      )}

      {/* PRICE */}
      <div className="price">
        <div className="amounts">
          {hasDiscount && (
            <div className="amount original">
              {currencySymbol}
              {Math.round(base)}
            </div>
          )}

          <div className="amount">
            {isFree ? (
              "Free"
            ) : (
              <>
                {currencySymbol}
                {Math.round(finalPrice)}
              </>
            )}
          </div>
        </div>

        {!isFree && <div className="per">{PER_LABELS[mode]}</div>}
      </div>

      {/* DISCOUNT */}
      {hasDiscount && (
        <div className="discount-banner">
          <span className="discount-badge">Discount</span>
          <span>{discountText}</span>
        </div>
      )}

      {/* NOTE */}
      <div className="note">
        {isFree ? pkg.description || "Free access." : NOTE_LABELS[mode]}
      </div>

      {/* FOOT */}
      <div className="fineprint">
        <span>
          {mode === "week" || !pkg.isCancellationPossible
            ? "No cancellation needed"
            : "Cancel anytime"}
        </span>
        <span className="sep">•</span>
        <span>Instant access</span>
      </div>

      <ul aria-label="Features included" className="features">
        {pkg.isAccessToAllMCQ && (
          <li>
            <CheckIcon />
            Full access to all MCQs
          </li>
        )}
        {pkg.isAccessToAllCodingQuestions && (
          <li>
            <CheckIcon />
            Full access to all coding questions
          </li>
        )}
        {pkg.isDashboardShouldBeViewable && (
          <li>
            <CheckIcon />
            Personal performance dashboard
          </li>
        )}
        {pkg.isTutorialsPageViewable && (
          <li>
            <CheckIcon />
            Tutorials &amp; learning resources
          </li>
        )}
        {pkg.isBlogShouldBeViewable && (
          <li>
            <CheckIcon />
            Blog &amp; articles access
          </li>
        )}
        {pkg.isRefundPossible && pkg.refundOfDays > 0 && (
          <li>
            <CheckIcon />
            {pkg.refundOfDays}-day refund window
          </li>
        )}
      </ul>

      {/* BUTTON */}
      <button
        className="select-btn select-btn-center"
        onClick={handleSelect}
        disabled={purchasing}
      >
        {" "}
        {purchasing
          ? "Processing…"
          : isFree
            ? "Get Started Free"
            : SELECT_LABELS[mode]}
      </button>
    </article>
  );
}

function Pricing() {
  usePageMeta("pricing");

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await getpackageslist();
      if (cancelled) return;
      if (res && res.status === 200 && Array.isArray(res.data)) {
        setPackages(res.data);
      } else {
        setError("Unable to load pricing right now. Please try again later.");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePackages = useMemo(() => {
    return packages.filter(
      (p) =>
        Array.isArray(p.packagePriceList) &&
        p.packagePriceList.some((pr) => !pr.isdeleted)
    );
  }, [packages]);

  return (
    <>
      <Topbar />

      <main className="wrap" id="mainContent">
        <section className="container">
          <header className="top">
            <div className="kicker">Pricing</div>
            <h1>Choose your subscription</h1>
            <p className="sub">One plan. Full access to everything.</p>
          </header>

          {loading && <div className="note">Loading pricing…</div>}

          {!loading && error && <div className="note">{error}</div>}

          {!loading && !error && visiblePackages.length === 0 && (
            <div className="note">No packages available right now.</div>
          )}

          {!loading && !error && visiblePackages.length > 0 && (
            <div className="grid">
              {visiblePackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Pricing;
