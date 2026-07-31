import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { ResetPasswordApi } from "../api/auth/apiauth";
import { Link, useLocation, useNavigate } from "react-router-dom";

function ResetPassword() {
  usePageMeta("password_reset");
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uniqueCode, setUniqueCode] = useState("");
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    validate();
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("uniquecode");
    if (code) {
      setUniqueCode(code);
    } else {
      Swal.fire({
        title: "Invalid or expired reset link",
        text: "This link is missing its reset code. Please request a new one.",
        icon: "error",
      });
    }
  }, [location.search]);

  // Mirrors ASP.NET Identity's actual default password rules (Program.cs has
  // no custom overrides): min length, at least one lowercase/uppercase/digit/
  // symbol. Shown inline on this dialog as the user types, so a missing
  // character type is caught here instead of surfacing as a confusing error
  // only after submit.
  const validate = () => {
    let newErrors = {
      newPassword: "",
      confirmPassword: "",
    };

    const missing = [];
    if (newPassword.length < 10) missing.push("at least 10 characters");
    if (!/[a-z]/.test(newPassword)) missing.push("a lowercase letter");
    if (!/[A-Z]/.test(newPassword)) missing.push("an uppercase letter");
    if (!/[0-9]/.test(newPassword)) missing.push("a number");
    if (!/[^a-zA-Z0-9]/.test(newPassword)) missing.push("a symbol");
    if (missing.length) {
      newErrors.newPassword = "Password needs " + missing.join(", ") + ".";
    }

    if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return !newErrors.newPassword && !newErrors.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const response = await ResetPasswordApi({
        uniqueCode,
        newPassword: newPassword,
      });

      // If API returns boolean true in response.data, the reset succeeded.
      if (response?.data === true) {
        Swal.fire({
          title: "Password updated",
          text: "Your password has been updated successfully.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => navigate("/"));
      } else {
        // Show the REAL backend reason (e.g. "this link has already been
        // used", or an Identity validation error) instead of a hardcoded
        // guess — a plain validation failure should never be mislabeled as
        // an expired link.
        const msg =
          typeof response?.data === "string" && response.data
            ? response.data
            : "Could not update your password. Please try again or request a new reset link.";
        Swal.fire({ title: "Could not reset password", text: msg, icon: "error" });
      }
    } catch (err) {
      Swal.fire({
        title: "Something went wrong",
        text: "Please try again.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Topbar />
      <div className="stage-shell">
        <div aria-hidden="true" className="watermark">
          <div className="wm-word" data-text="CODIVIUM">
            CODIVIUM
          </div>
        </div>
        <main className="stage" role="main" id="mainContent">
          <h1 className="sr-only">Change your Codivium password</h1>
          <section
            aria-label="Reset password form"
            className="login-card"
            id="resetCard"
          >
            <div className="login-card-top">
              <div className="login-strip-title">Reset your password</div>
            </div>
            <div className="login-card-body">
              <p className="login-sub">
                Choose a new password for your account.
              </p>
              <form
                className="cv-form"
                id="resetForm"
                onSubmit={handleSubmit}
                noValidate
              >
                <label className="cv-field">
                  <span className="cv-label">New password</span>
                  <div className="cv-input-wrap">
                    <input
                      id="cvNewPass"
                      name="new_password"
                      type={showNew ? "text" : "password"}
                      placeholder="new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowNew(!showNew)}
                      aria-pressed={showNew}
                    >
                      <svg
                        aria-hidden="true"
                        className={`icon-eye ${showNew ? "icon-eye-open" : "icon-eye-closed"}`}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z"
                          fill="none"
                          stroke="currentColor"
                          stroke-linejoin="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        ></path>
                      </svg>
                      <svg
                        aria-hidden="true"
                        className={`icon-eye ${showNew ? "icon-eye-closed" : "icon-eye-open"}`}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 3l18 18"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M2.2 12s3.4-6.4 9.8-6.4c2 0 3.7.6 5.1 1.5M21.8 12s-3.4 6.4-9.8 6.4c-2 0-3.7-.6-5.1-1.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M10.2 10.2A3.2 3.2 0 0 0 12 15.2"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  {errors.newPassword && (
                    <span className="cv-error">{errors.newPassword}</span>
                  )}
                </label>
                <label className="cv-field">
                  <span className="cv-label">Confirm password</span>
                  <div className="cv-input-wrap">
                    <input
                      id="cvConfirmPass"
                      name="confirm_password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="pass-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-pressed={showConfirm}
                    >
                      <svg
                        aria-hidden="true"
                        className={`icon-eye ${showConfirm ? "icon-eye-open" : "icon-eye-closed"}`}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z"
                          fill="none"
                          stroke="currentColor"
                          stroke-linejoin="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        ></path>
                      </svg>
                      <svg
                        aria-hidden="true"
                        className={`icon-eye ${showConfirm ? "icon-eye-closed" : "icon-eye-open"}`}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 3l18 18"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M2.2 12s3.4-6.4 9.8-6.4c2 0 3.7.6 5.1 1.5M21.8 12s-3.4 6.4-9.8 6.4c-2 0-3.7-.6-5.1-1.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        ></path>
                        <path
                          d="M10.2 10.2A3.2 3.2 0 0 0 12 15.2"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="cv-error">{errors.confirmPassword}</span>
                  )}
                </label>
                <div
                  aria-live="polite"
                  className="caps-indicator"
                  id="capsIndicator"
                  role="status"
                >
                  CAPS LOCK
                </div>
                <div className="form-hint">
                  Minimum 10 characters, including a lowercase letter, an
                  uppercase letter, a number, and a symbol.
                </div>
                <div aria-live="polite" className="form-msg" id="formMsg"></div>
                <button
                  className="login-btn"
                  id="resetBtn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </form>
              <div className="login-links">
                <Link to="/login">Back to login</Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default ResetPassword;
