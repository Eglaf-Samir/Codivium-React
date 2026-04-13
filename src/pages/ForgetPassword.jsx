import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { ForgetPasswordApi } from "../api/auth/apiauth";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
      const response = await ForgetPasswordApi(email);
      console.log("response:forgetpasswor==>", response);
      if (response?.data === true) {
        toast.success("Password reset link sent to your email", {
          position: "top-right",
          autoClose: 3000,
        });

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error("Email address not found", {
          position: "top-right",
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
                <a href="/login">Back to login</a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default ForgetPassword;
