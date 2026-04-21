import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { role } from "../config";
import { Link, useNavigate } from "react-router-dom";
import { CreateUserNew } from "../api/auth/apiauth";
import { toast, ToastContainer } from "react-toastify";

function Join() {
  usePageMeta("join");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    let newErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    }

    if (form.firstName && form.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (form.lastName && form.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.agree) {
      newErrors.agree = "You must accept terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      const res = await CreateUserNew({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
        rolename: role.User,
      });

      if (res?.status === 200) {
        toast.success("Account created successfully");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error(err?.response?.data || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <ToastContainer />
      <div aria-hidden="true" className="cv-underbar"></div>
      <div aria-hidden="true" className="watermark">
        <div className="word" data-text="CODIVIUM">
          CODIVIUM
        </div>
      </div>
      <main className="wrap" id="mainContent" role="main">
        <section aria-label="Subscribe" className="container">
          <header className="top">
            <div className="kicker">Subscribe</div>
            <h1>Create your account</h1>
            <p className="sub">
              Enter your details to create your Codivium login. You’ll be
              redirected to a secure third-party checkout (e.g., Stripe) to
              complete payment.
            </p>
          </header>
          <div className="centered">
            <article aria-label="Account details form" className="card">
              <div className="plan">
                <h2>Account details</h2>
                <span className="tag">Secure</span>
              </div>
              <div className="smallrow smallrow-gap">
                <span aria-label="Secure checkout" className="securepill">
                  <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M7 11V8a5 5 0 0 1 10 0v3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M6 11h12v9H6z"
                      stroke="currentColor"
                      stroke-linejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  Redirects to secure checkout
                </span>
                <Link className="inline-login-link" to="/login">
                  Already have an account? Log in
                </Link>
              </div>
              <form
                action=""
                className="subscribe-form-offset"
                onSubmit={handleSubmit}
              >
                <input
                  id="selectedPlan"
                  name="selectedPlan"
                  type="hidden"
                  value=""
                />
                <div className="form-grid">
                  <div className="field field-full">
                    <label for="email">Email address</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="input"
                    />
                    {errors.email && <p className="error">{errors.email}</p>}
                    <p className="hint">This becomes your Codivium login.</p>
                  </div>
                  <div className="field">
                    <label for="firstName">First name (optional)</label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      type="text"
                      className="input"
                    />

                    {errors.firstName && (
                      <p className="error">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="field">
                    <label for="lastName">Surname (optional)</label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Surname"
                      type="text"
                      className="input"
                    />

                    {errors.lastName && (
                      <p className="error">{errors.lastName}</p>
                    )}
                  </div>
                  <div className="field field-full">
                    <label for="password">Password</label>
                    <div className="pw-wrap">
                      <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        className="input"
                      />
                      {errors.password && (
                        <p className="error">{errors.password}</p>
                      )}
                      <button
                        aria-controls="password password2"
                        aria-pressed="false"
                        className="pw-toggle"
                        id="pwToggle"
                        type="button"
                      >
                        Show
                      </button>
                    </div>
                    <div className="pw-hint">
                      <p className="hint hint-gap-sm">What we expect:</p>
                      <ul>
                        <li>
                          <b>Minimum:</b> 8 characters (we’ll block anything
                          shorter).
                        </li>
                        <li>
                          <b>Required mix:</b> at least <b>1 lowercase</b>,{" "}
                          <b>1 uppercase</b>, <b>1 number</b>, and{" "}
                          <b>1 symbol</b> (e.g., ! @ # $ % *).
                        </li>
                        <li>
                          <b>Recommended:</b> 14–20+ characters — a{" "}
                          <b>passphrase</b> is best (e.g., 4 random words).
                        </li>
                        <li>
                          <b>Avoid:</b> names, email, dates, “Password123”,
                          keyboard patterns, or anything you reuse elsewhere.
                        </li>
                        <li>
                          <b>Tip:</b> a password manager makes this easy and
                          safer.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="field field-full">
                    <label for="password2">Confirm password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="input"
                    />
                    {errors.confirmPassword && (
                      <p className="error">{errors.confirmPassword}</p>
                    )}
                    <p className="hint">Must match exactly.</p>
                  </div>
                </div>
                <div className="divider"></div>
                <div className="checkline">
                  <input
                    type="checkbox"
                    name="agree"
                    checked={form.agree}
                    onChange={handleChange}
                  />
                  {errors.agree && <p className="error">{errors.agree}</p>}
                  <div>
                    <label className="terms-label" for="agree">
                      Terms &amp; privacy confirmation
                    </label>
                    <p className="hint hint-gap-xs">
                      I agree to the{" "}
                      <Link to="/legal#terms_conditions" target="_blank">
                        Terms &amp; Privacy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    aria-disabled="true"
                    disabled=""
                    id="subscribeBtn"
                    type="submit"
                  >
                    Join Now!
                  </button>
                  <p className="hint hint-reset">
                    Next step: you’ll confirm your plan and payment in a secure
                    third-party checkout.
                  </p>
                </div>
              </form>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

export default Join;
