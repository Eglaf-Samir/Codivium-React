import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { ResetPasswordApi } from "../api/auth/apiauth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

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
      toast.error("Invalid or expired reset link");
    }
  }, [location.search]);

  const validate = () => {
    let newErrors = {
      newPassword: "",
      confirmPassword: "",
    };

    if (newPassword.length < 10) {
      newErrors.newPassword = "Minimum 10 characters required";
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

      console.log("response:resetpassword==>", response);

      // ✅ If API returns boolean in response.data
      if (response?.data === true) {
        toast.success("Password updated successfully", {
          autoClose: 3000,
        });

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error("Invalid or expired reset link", {
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Topbar />
      <ToastContainer />
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
                  Minimum 10 characters recommended. Use a mix of letters,
                  numbers, and symbols.
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
