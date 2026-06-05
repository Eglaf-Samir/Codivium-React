import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { role } from "../config";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CreateUserNew, SendVerifyEmail, VerifyEmailToken, CheckVerifyStatus } from "../api/auth/apiauth";
import { toast, ToastContainer } from "react-toastify";

const RESEND_COOLDOWN_SECONDS = 15;

function Join() {
  usePageMeta("join");
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showPassword, setShowPassword] = useState(false);

  // Verify-email-first signup:
  //  - Step 1 (emailVerified=false): only the email field + Verify button.
  //    After Verify, the button enters a 15-second resend cooldown, then
  //    becomes "Resend link". The link in the email is valid for 24 hours.
  //  - Step 2 (emailVerified=true): the rest of the form unlocks, email is
  //    pre-filled and disabled, and the existing signup flow continues.
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [sendingVerify, setSendingVerify] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  // True only on the device that just opened the email link — shows a
  // "Verified Successfully" screen with a "Go to Registration" button, so the
  // user can continue here even if the original signup tab was closed.
  const [showVerifiedLanding, setShowVerifiedLanding] = useState(false);
  // True when the verification link was already used to create an account
  // (email already registered). The form stays "verified — locked" but Join is
  // disabled; the user should log in instead.
  const [linkUsed, setLinkUsed] = useState(false);

  // Step 2 entry: the user opened /join?verify=TOKEN from their inbox.
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const token = params.get("verify");
    if (!token) return;
    let cancelled = false;
    (async () => {
      setVerifying(true);
      const res = await VerifyEmailToken(token);
      if (cancelled) return;
      const ok = res?.status === 200 && (res.data?.ok === true || res.data?.email);
      if (ok) {
        const email = res.data.email || "";
        const used = res.data.alreadyRegistered === true;
        setForm((prev) => ({ ...prev, email }));
        setVerifyToken(token);
        setEmailVerified(true);
        setVerifyError("");
        if (used) {
          // Link already used to create the account — keep "verified — locked"
          // but block Join (show the form, not the success popup).
          setLinkUsed(true);
        } else {
          // Fresh verification — show the "Verified Successfully" landing on THIS
          // device so the user can continue registration here.
          setShowVerifiedLanding(true);
        }
        // Also tell any other open /join tab (the original signup window) so it
        // can continue there too — bonus for same-browser, harmless otherwise.
        try {
          localStorage.setItem(
            "cv_verify_signal",
            JSON.stringify({ email, token, used, ts: Date.now() }),
          );
        } catch (_) { /* ignore */ }
      } else {
        setVerifyError(
          (res && res.data && (res.data.message || res.data)) ||
          "This verification link is invalid or has expired. Please request a new one."
        );
      }
      setVerifying(false);
    })();
    return () => { cancelled = true; };
  }, [location.search]);

  // Cross-tab listener: if another tab finishes verification, this tab
  // (the original signup window) flips to step 2 with the verified email.
  useEffect(() => {
    function onStorage(ev) {
      if (ev.key !== "cv_verify_signal" || !ev.newValue) return;
      try {
        const obj = JSON.parse(ev.newValue);
        if (!obj?.token || !obj?.email) return;
        if (obj.ts && Date.now() - obj.ts > 30_000) return; // ignore stale
        setForm((prev) => ({ ...prev, email: obj.email }));
        setVerifyToken(obj.token);
        setEmailVerified(true);
        setVerifyError("");
        if (obj.used === true) setLinkUsed(true);
        try { window.focus(); } catch (_) {}
      } catch (_) { /* ignore */ }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Cross-DEVICE polling: if the link is opened on a different device (e.g. the
  // phone), this window never gets the localStorage signal above. So once a
  // verification email has been sent, poll the backend until the email is
  // verified anywhere, then auto-advance to step 2 — no manual refresh needed.
  useEffect(() => {
    if (emailVerified) return;        // already verified
    if (!verifyMessage) return;       // nothing sent yet (or email was edited)
    const email = (form.email || "").trim();
    if (!email) return;

    let stopped = false;
    let elapsed = 0;
    const POLL_MS = 3000;
    const MAX_MS = 15 * 60 * 1000;    // stop polling after 15 minutes of waiting

    const id = setInterval(async () => {
      if (stopped) return;
      elapsed += POLL_MS;
      const res = await CheckVerifyStatus(email);
      if (stopped) return;
      if (res?.status === 200 && res.data?.isVerified && res.data?.token) {
        stopped = true;
        clearInterval(id);
        setForm((prev) => ({ ...prev, email: res.data.email || email }));
        setVerifyToken(res.data.token);
        setEmailVerified(true);
        setVerifyError("");
        if (res.data.alreadyRegistered === true) setLinkUsed(true);
      } else if (elapsed >= MAX_MS) {
        stopped = true;
        clearInterval(id);
      }
    }, POLL_MS);

    return () => { stopped = true; clearInterval(id); };
  }, [emailVerified, verifyMessage, form.email]);

  // Resend-cooldown timer (ref-based, so React's state churn never stops it).
  const cooldownTimerRef = useRef(null);
  useEffect(() => () => {
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
  }, []);
  const startCooldown = (seconds) => {
    setCooldown(seconds);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownTimerRef.current);
          cooldownTimerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // If the user edits the email after a verify link was sent (but before
    // they verified), clear the "sent" message so it doesn't lie about the
    // current address.
    if (name === "email" && !emailVerified) {
      if (verifyMessage) setVerifyMessage("");
      if (verifyError) setVerifyError("");
    }
  };

  const handleSendVerify = async () => {
    if (sendingVerify || cooldown > 0) return;
    setVerifyError("");
    setVerifyMessage("");
    const email = (form.email || "").trim();
    if (!email) { setErrors((e) => ({ ...e, email: "Email is required" })); return; }
    // Basic format check — avoids a roundtrip for obvious typos.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email address" }));
      return;
    }
    setErrors((e) => { const n = { ...e }; delete n.email; return n; });

    setSendingVerify(true);
    let res;
    try { res = await SendVerifyEmail(email); } catch (e) { res = e; }
    setSendingVerify(false);

    if (res?.status === 200 && res.data?.sent) {
      setVerifyMessage(`Verification link sent to ${email}. Check your inbox (valid for 24 hours).`);
      startCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      setVerifyError(
        (res && (res.data?.message || res.data)) || "Could not send verification email. Please try again."
      );
    }
  };

  const validate = () => {
    let newErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    }

    if (!form.firstName || !form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (form.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!form.lastName || !form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (form.lastName.trim().length < 2) {
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
    if (loading) return; // guard against double-submit

    // Guard: until the email is verified, the rest of the form isn't usable.
    // Pressing Enter on the email field should send the verify link, not error.
    if (!emailVerified || !verifyToken) {
      handleSendVerify();
      return;
    }

    if (!validate()) return;

    try {
      setLoading(true);
      const res = await CreateUserNew({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
        rolename: role.User,
        verifyToken,
      });

      if (res?.status === 200 && res?.data?.id) {
        // Auto-login: the register endpoint now returns the same payload as
        // login (token + role + active package). Store it exactly like Login.jsx
        // so the user is signed in without a second login step.
        const data = res.data;
        localStorage.setItem("Userid", data.id);
        localStorage.setItem("LoginToken", data.loginToken);
        localStorage.setItem("UserRoleName", data.roleName);
        // Persist the real name/email so the sidebar profile can show it.
        {
          const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ").trim()
            || [form.firstName, form.lastName].filter(Boolean).join(" ").trim();
          localStorage.setItem("UserDisplayName", fullName);
          localStorage.setItem("UserEmail", data.email || form.email || "");
        }
        if (data.activePackage) {
          localStorage.setItem(
            "userpackagedetails",
            JSON.stringify(data.activePackage),
          );
        }

        toast.success("Account created successfully");
        // Send the new user to pricing; they can buy a package there or use
        // the "Skip for now" button to go straight to the dashboard.
        setTimeout(() => navigate("/pricing?welcome=1"), 800);
      } else {
        toast.error(res?.data || "Signup failed");
      }
    } catch (err) {
      toast.error(err?.response?.data || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // Join is allowed only when: email is verified AND the link wasn't already
  // used to register, first + last name are filled, password is set and matches,
  // and the terms are accepted.
  const canSubmit =
    emailVerified &&
    !!verifyToken &&
    !linkUsed &&
    !!(form.firstName || "").trim() &&
    !!(form.lastName || "").trim() &&
    !!form.password &&
    form.password === form.confirmPassword &&
    !!form.agree;

  // Verified screen as a standalone full-screen popup. Portaled to document.body
  // so it positions against the VIEWPORT (an ancestor transform/filter on the
  // page can otherwise trap a position:fixed child and push it off-screen — the
  // reason it showed blank on phones). Scrollable so a tall card is always
  // reachable on small screens. No topbar / page header / sidebar.
  if (showVerifiedLanding) {
    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Email verified"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2147483000, background: 'rgba(5,7,12,0.97)',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{
          boxSizing: 'border-box', minHeight: '100%', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}>
          <div style={{
            boxSizing: 'border-box', width: '100%', maxWidth: 420,
            background: '#11151f', border: '1px solid #2a3346', borderTop: '3px solid #f6d58a',
            borderRadius: 16, padding: '34px 24px', textAlign: 'center',
            boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 18px', borderRadius: '50%', background: '#c8f4d6', border: '1px solid #6abf86', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="#0a3d1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase', color: '#2e9d5f', marginBottom: 8, fontWeight: 700 }}>Verified</div>
            <h2 style={{ margin: '0 0 10px', color: '#eef1f5', fontSize: 22, fontWeight: 700 }}>Email verified successfully</h2>
            <p style={{ margin: '0 0 24px', color: '#aab2c0', fontSize: 15, lineHeight: 1.6 }}>
              {form.email ? <>Great — <strong style={{ color: '#eef1f5' }}>{form.email}</strong> is confirmed.</> : 'Great — your email is confirmed.'}{' '}
              Continue to finish creating your Codivium account.
            </p>
            <button
              type="button"
              onClick={() => setShowVerifiedLanding(false)}
              style={{
                width: '100%', maxWidth: 280, padding: '14px 28px',
                background: '#f6d58a', color: '#05070c', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 15, letterSpacing: '0.5px', cursor: 'pointer',
              }}
            >
              Continue Registration
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

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
                    <div style={{ position: 'relative' }}>
                      <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="input"
                        type="email"
                        autoComplete="email"
                        readOnly={emailVerified}
                        disabled={emailVerified}
                        style={emailVerified ? { paddingRight: 102 } : undefined}
                      />
                      {emailVerified && (
                        <span
                          aria-label="Email verified"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: 10,
                            transform: 'translateY(-50%)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: '#0a3d1f',
                            background: '#c8f4d6',
                            border: '1px solid #6abf86',
                            pointerEvents: 'none',
                            lineHeight: 1,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" stroke="#0a3d1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    {errors.email && <p className="error">{errors.email}</p>}
                    <p className="hint">
                      {emailVerified
                        ? (
                          <>
                            Email verified — locked.{' '}
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                // Suggestion: let the user fix a typo by resetting
                                // verification — they can verify a different email.
                                setEmailVerified(false);
                                setVerifyToken('');
                                setVerifyMessage('');
                                setVerifyError('');
                                setLinkUsed(false);
                                setCooldown(0);
                                if (cooldownTimerRef.current) {
                                  clearInterval(cooldownTimerRef.current);
                                  cooldownTimerRef.current = null;
                                }
                              }}
                              style={{ color: 'var(--color-text-accent, #d8b268)' }}
                            >
                              Change email
                            </a>
                          </>
                        )
                        : 'This becomes your Codivium login.'}
                    </p>
                  </div>

                  {/* Step 1: Verify email — shown until the user clicks the link in their inbox. */}
                  {!emailVerified && (
                    <div className="field field-full">
                      <div className="form-actions">
                        {/* Reuses #subscribeBtn so the styling matches the
                            Join Now! CTA exactly. Safe — only one of the two
                            buttons exists in the DOM at any time (verify when
                            !emailVerified, Join Now when emailVerified). */}
                        <button
                          id="subscribeBtn"
                          type="button"
                          onClick={handleSendVerify}
                          disabled={sendingVerify || cooldown > 0}
                          aria-busy={sendingVerify}
                          aria-disabled={sendingVerify || cooldown > 0}
                        >
                          {sendingVerify
                            ? "Sending…"
                            : cooldown > 0
                              ? `Resend link in ${cooldown}s`
                              : verifyMessage
                                ? "Resend link"
                                : "Verify email"}
                        </button>
                      </div>
                      {verifying && (
                        <p className="hint hint-gap-sm">Verifying your link…</p>
                      )}
                      {verifyMessage && (
                        <p className="hint hint-gap-sm">{verifyMessage}</p>
                      )}
                      {verifyError && (
                        <p className="error">{verifyError}</p>
                      )}
                      <p className="hint hint-gap-sm">
                        We'll email you a confirmation link. Click it within 24 hours to continue your signup.
                        If you already had this signup tab open, it will update automatically when you click the link.
                      </p>
                    </div>
                  )}

                  {/* Step 2: rest of the form, unlocked after email verification. */}
                  {emailVerified && (
                  <>
                  <div className="field">
                    <label for="firstName">First name</label>
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
                    <label for="lastName">Surname</label>
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
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleChange}
                        className="input"
                      />
                      {errors.password && (
                        <p className="error">{errors.password}</p>
                      )}
                      <button
                        aria-controls="password password2"
                        aria-pressed={showPassword}
                        className="pw-toggle"
                        id="pwToggle"
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? "Hide" : "Show"}
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
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="input"
                    />
                    {errors.confirmPassword && (
                      <p className="error">{errors.confirmPassword}</p>
                    )}
                    <p className="hint">Must match exactly.</p>
                  </div>
                  </>
                  )}
                </div>
                {emailVerified && (
                <>
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
                {linkUsed && (
                  <p className="error" style={{ marginBottom: 8 }}>
                    This email is already registered — this verification link has
                    already been used. Please <Link to="/login">log in</Link> instead,
                    or use “Change email” above to sign up with a different email.
                  </p>
                )}
                <div className="form-actions">
                  <button
                    aria-disabled={loading || !canSubmit}
                    aria-busy={loading}
                    disabled={loading || !canSubmit}
                    id="subscribeBtn"
                    type="submit"
                  >
                    {loading ? 'Joining…' : 'Join Now!'}
                  </button>
                  <p className="hint hint-reset">
                    Next step: you’ll confirm your plan and payment in a secure
                    third-party checkout.
                  </p>
                </div>
                </>
                )}
              </form>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

export default Join;
