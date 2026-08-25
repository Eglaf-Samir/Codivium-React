import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { ForgetPasswordApi } from "../api/auth/apiauth";
import { Link, useNavigate } from "react-router-dom";

function ForgetPassword() {
  const navigate = useNavigate();
  usePageMeta("password_reset");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!email) return "Email is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Enter valid email";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setError("");

    try {
      setLoading(true);
      // Always show the same message regardless of whether the email exists —
      // a differing response here would let an attacker enumerate registered
      // accounts. The backend call still fires either way; we just never
      // surface its true/false result to the user.
      await ForgetPasswordApi(email);
      Swal.fire({
        title: "Check your email",
        text: "If an account exists for this email address, a password reset link will be sent shortly.",
        icon: "info",
        timer: 3000,
        showConfirmButton: true,
      }).then(() => navigate("/login"));
    } catch (err) {
      // A genuine transport/server failure (network down, 500, etc.) is not
      // an information-leak risk — it's fine to report this one differently.
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
                Enter your email to receive a password reset link.
              </p>
              <form
                action=""
                autocomplete="off"
                className="cv-form"
                id="resetForm"
                method="post"
                novalidate=""
                onSubmit={handleSubmit}
              >
                <label className="cv-field">
                  <span className="cv-label">Email address</span>

                  <div className="cv-input-wrap">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                    />
                  </div>

                  {/* ERROR */}
                  {error && <span className="cv-error">{error}</span>}
                </label>

                <div aria-live="polite" className="form-msg" id="formMsg"></div>
                <button
                  className="login-btn"
                  id="resetBtn"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <div className="login-links">
                {/* <a href="/login">Back to login</a> */}
                <Link className="s5-cta" to="/login">
                  Back to login
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default ForgetPassword;
