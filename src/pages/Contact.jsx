import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Topbar from "../components/Topbar";
import usePageMeta from "../hooks/usePageMeta";
import { CreateContact } from "../api/contact/apicontact";

function Contact() {
  usePageMeta("contact");
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    consent: false,
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

    if (!form.name) {
      newErrors.name = "Name is required";
    }

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email";
    }

    if (!form.topic) {
      newErrors.topic = "Select a topic";
    }

    if (!form.message) {
      newErrors.message = "Message is required";
    }

    if (!form.consent) {
      newErrors.consent = "You must agree before submitting";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Missing consent already shows inline right under the checkbox
      // (errors.consent below) — no separate popup needed for that case.
      // Other missing/invalid fields also render inline per-field; only
      // nudge with a popup when there's something beyond just the checkbox.
      if (!form.consent) return;
      Swal.fire({
        title: "Check the form",
        text: "Please fix the highlighted fields before sending.",
        icon: "warning",
      });
      return;
    }
    const body = {
      name: form.name,
      emailAddress: form.email,
      topic: form.topic,
      queryDetail: form.message,
      marketingPreference: form.consent,
    };
    setLoading(true);
    try {
      const res = await CreateContact(body);
      if (res?.data?.id > 0) {
        setForm({
          name: "",
          email: "",
          topic: "",
          message: "",
          consent: false,
        });
        Swal.fire({
          title: "Message sent",
          text: "Thank you for getting in touch! We appreciate you contacting us!",
          icon: "success",
          timer: 3000,
          showConfirmButton: true,
        });
      } else {
        Swal.fire({
          title: "Something went wrong",
          text: "Could not send your message. Please try again.",
          icon: "error",
        });
      }
    } catch (err) {
      console.error("Contact form submit failed:", err);
      Swal.fire({
        title: "Something went wrong",
        text: "Could not send your message. Please try again.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Topbar />
      <div aria-hidden="true" className="watermarks">
        <div className="wm w1" data-text="Codivium">
          CODIVIUM
        </div>
        <div className="wm w2" data-text="Codivium">
          CODIVIUM
        </div>
        <div className="wm w3" data-text="Codivium">
          CODIVIUM
        </div>
      </div>
      <div aria-hidden="true" className="cv-underbar"></div>
      <main className="page" id="mainContent" role="main">
        <div className="shell">
          <section aria-label="Contact form" className="card">
            <div aria-hidden="true" className="edgeGlow"></div>
            <div className="card-pad">
              <h1 className="title">Contact Codivium</h1>
              <p className="subtitle">
                Send us questions, feedback, partnership ideas, or anything
                you’d like us to improve. We usually respond within 1–2 business
                days.
              </p>
              <div className="divider"></div>
              <form action="" onSubmit={handleSubmit}>
                <label aria-hidden="true" className="hp">
                  Company website (leave blank)
                  <input
                    aria-hidden="true"
                    autocomplete="off"
                    name="company_website"
                    tabindex="-1"
                    type="text"
                  />
                </label>
                <div className="row2">
                  <div className="fgroup">
                    <label className="flabel" for="name">
                      Name
                    </label>
                    <div className="control">
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="input"
                      />
                      {errors.name && <p className="error">{errors.name}</p>}
                    </div>
                  </div>
                  <div className="fgroup">
                    <label className="flabel" for="email">
                      Email
                    </label>
                    <div className="control">
                      <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@domain.com"
                        className="input"
                      />
                      {errors.email && <p className="error">{errors.email}</p>}
                    </div>
                  </div>
                </div>
                <div className="fgroup">
                  <label className="flabel" for="topic">
                    Topic
                  </label>
                  <div className="control">
                    <select
                      name="topic"
                      value={form.topic}
                      onChange={handleChange}
                    >
                      <option disabled="" selected="" value="">
                        Select a topic…
                      </option>
                      <option>General question</option>
                      <option>Billing / pricing</option>
                      <option>Bug report</option>
                      <option>Interview prep</option>
                      <option>Micro challenges</option>
                      <option>Other</option>
                    </select>
                    {errors.topic && <p className="error">{errors.topic}</p>}
                    <svg
                      aria-hidden="true"
                      className="sel-arrow"
                      viewBox="0 0 24 24"
                    >
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
                <div className="fgroup">
                  <label className="flabel" for="message">
                    Message
                  </label>
                  <div className="control">
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Write your message here…"
                    />
                    {errors.message && (
                      <p className="error">{errors.message}</p>
                    )}
                  </div>
                  <div className="meta-row">
                    <div className="hint">
                      Please don’t include passwords or payment details.
                    </div>
                    <div className="count" id="count">
                      0 / 4000
                    </div>
                  </div>
                </div>
                <div className="actions">
                  <label className="policy">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={form.consent}
                      onChange={handleChange}
                    />
                    {errors.consent && (
                      <p className="error">{errors.consent}</p>
                    )}
                    <span>
                      I agree to be contacted back by email regarding this
                      message.
                    </span>
                  </label>
                  <div className="btns">
                    <button className="ghost" id="clearBtn" type="button">
                      Clear
                    </button>
                    <button
                      className="btn"
                      id="sendBtn"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default Contact;
