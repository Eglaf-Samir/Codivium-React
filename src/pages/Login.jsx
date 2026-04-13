import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { useNavigate } from "react-router-dom";
import { Loginuser } from "../api/auth/apiauth";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import { validateLoginForm } from "../utils/validation";
import { role } from "../config";

function Login() {
  usePageMeta("login");
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logindata, setLogindata] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    apiError: "",
  });

  const handleKeyDown = (e) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();
    let gotologintoPrice = localStorage.getItem("gotologintoPrice");
    const validationErrors = validateLoginForm(logindata);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({ email: "", password: "", apiError: "" });

    try {
      setLoading(true);
      const response = await Loginuser(logindata);

      if (response?.status === 200 && response?.data?.id) {
        if (response?.data?.isActive) {
          // ✅ STORAGE
          localStorage.setItem("Userid", response.data.id);
          localStorage.setItem("LoginToken", response.data.loginToken);
          localStorage.setItem("UserRoleName", response.data.roleName);

          if (response.data.activePackage) {
            localStorage.setItem(
              "userpackagedetails",
              JSON.stringify(response.data.activePackage),
            );
          }

          if (gotologintoPrice === "true") {
            localStorage.setItem("gotologintoPrice", "");
            navigate("/price");
          } else if (response.data.roleName === role.Superadmin) {
            navigate("/AdminDashboard");
          } else {
            navigate("/adaptive_practice");
          }
        } else {
          Swal.fire({
            title: "Warning!",
            text: "Your account is deactivated",
            icon: "warning",
          });
        }
      } else {
        toast.error("Invalid email or password");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <ToastContainer />
      <div aria-hidden="true" className="cv-underbar"></div>
      <div className="stage-shell">
        <div aria-hidden="true" className="watermark">
          <div className="wm-word" data-text="CODIVIUM">
            CODIVIUM
          </div>
        </div>
        <main className="stage login-stage" role="main" id="mainContent">
          <h1 className="sr-only">Login to Codivium</h1>
          <div className="centered">
            <section aria-label="Login form" className="login-card">
              <div className="login-card-top">
                <div className="login-strip-title">Login to Codivium</div>
              </div>
              <div className="login-card-body">
                <form className="cv-form" onSubmit={handleSubmit}>
                  <label className="cv-field">
                    <span className="cv-label">Username / Email</span>
                    <input
                      autoComplete="username"
                      placeholder="you@example.com"
                      type="text"
                      value={logindata.email}
                      onChange={(e) =>
                        setLogindata({ ...logindata, email: e.target.value })
                      }
                    />
                    {errors.email && (
                      <span className="cv-error">{errors.email}</span>
                    )}
                  </label>

                  {/* PASSWORD */}
                  <label className="cv-field">
                    <span className="cv-label">Password</span>
                    <div className="cv-input-wrap">
                      <input
                        autoComplete="current-password"
                        placeholder="password"
                        type={showPass ? "text" : "password"}
                        value={logindata.password}
                        onChange={(e) =>
                          setLogindata({
                            ...logindata,
                            password: e.target.value,
                          })
                        }
                        onKeyDown={handleKeyDown}
                      />

                      {/* TOGGLE */}
                      <button
                        type="button"
                        className="pass-toggle"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {/* 👁 */}
                        {showPass ? (
                          <svg
                            aria-hidden="true"
                            className="icon-eye icon-eye-open"
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
                        ) : (
                          <svg
                            aria-hidden="true"
                            className="icon-eye icon-eye-closed"
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
                        )}
                      </button>
                    </div>
                    {errors.email && (
                      <span className="cv-error">{errors.email}</span>
                    )}
                  </label>

                  {/* CAPS LOCK */}
                  {capsLock && <div className="caps-indicator">CAPS LOCK</div>}

                  {/* BUTTON */}
                  <button
                    className="login-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div
                  aria-live="polite"
                  className="login-status"
                  hidden="hidden"
                  id="loginMsg"
                ></div>
                <div className="login-links">
                  <a className="login-link-forgot" href="/forget_password">
                    Forgotten your password?
                  </a>
                  <a className="login-link-join" href="/join">
                    Not a member, want to join?
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

export default Login;
