// PaymentFailed.jsx — Stripe cancel/failure landing (configured as <domain>/failer).
import { useNavigate } from "react-router-dom";
import { isSuperAdmin } from "../utils/auth";

export default function PaymentFailed() {
  const navigate = useNavigate();

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
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h1 style={{ margin: 0 }}>Payment not completed</h1>
      <p style={{ margin: 0, opacity: 0.8, maxWidth: 460 }}>
        Your payment was cancelled or could not be processed. No charge was made.
        You can try again or continue with your current plan.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(180deg, #d8b268, #b8924a)",
            color: "#1a1408",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(isSuperAdmin() ? "/AdminDashboard" : "/adaptive-practice")
          }
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.3)",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
