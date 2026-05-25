// PaymentSuccess.jsx — Stripe success landing (configured as <domain>/success).
// The webhook assigns the package server-side, but it can lag a moment, so we
// poll the active-package API, refresh the cached package, then go to dashboard.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActivePackagebyuserid,
  verifycheckoutsession,
} from "../api/pricepackage/apipackage";
import { isSuperAdmin } from "../utils/auth";

const MAX_ATTEMPTS = 6; // ~9s total
const POLL_MS = 1500;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your payment…");
  const cancelled = useRef(false);

  const goDashboard = () =>
    navigate(isSuperAdmin() ? "/AdminDashboard" : "/adaptive-practice");

  useEffect(() => {
    const userId = localStorage.getItem("Userid");
    if (!userId) {
      navigate("/login");
      return;
    }
    let attempts = 0;
    let timer;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await ActivePackagebyuserid(userId);
        if (res?.status === 200 && res.data) {
          // Refresh cached package so Settings / Pricing / menu locking update.
          localStorage.setItem("userpackagedetails", JSON.stringify(res.data));
          const isDefault = res.data.isDefault ?? res.data.IsDefault;
          const hasAllCoding =
            res.data.isAccessToAllCodingQuestions ??
            res.data.IsAccessToAllCodingQuestions;
          // Paid package active (no longer free/default, or grants coding access).
          if (isDefault === false || hasAllCoding === true) {
            if (!cancelled.current) {
              setMessage("Payment successful! Your plan is active.");
              setTimeout(goDashboard, 1200);
            }
            return;
          }
        }
      } catch (e) {
        /* keep polling */
      }
      if (attempts >= MAX_ATTEMPTS) {
        // Webhook may still be processing — let the user proceed anyway.
        if (!cancelled.current) {
          setMessage(
            "Payment received. Your plan will activate shortly.",
          );
          setTimeout(goDashboard, 1500);
        }
        return;
      }
      timer = setTimeout(poll, POLL_MS);
    };

    (async () => {
      // Fallback: verify the Stripe session and provision the package right away
      // (idempotent with the webhook). Works even if the webhook is delayed or,
      // in local/dev, can't reach the backend. Then poll to refresh the UI.
      const sessionId = new URLSearchParams(window.location.search).get(
        "session_id",
      );
      if (sessionId) {
        try {
          await verifycheckoutsession(sessionId);
        } catch (e) {
          /* fall through to polling */
        }
      }
      if (!cancelled.current) poll();
    })();

    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 48 }}>✅</div>
      <h1 style={{ margin: 0 }}>{message}</h1>
      <button
        type="button"
        onClick={goDashboard}
        style={{
          marginTop: 8,
          padding: "10px 22px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(180deg, #d8b268, #b8924a)",
          color: "#1a1408",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Go to dashboard →
      </button>
    </div>
  );
}
