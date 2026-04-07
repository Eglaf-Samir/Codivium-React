import { useState, useEffect } from "react";
import Header from "../components/Header";
import usePageMeta from "../hooks/usePageMeta";

function Contact() {
  usePageMeta("contact");
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
    phone: "5565859565",
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

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

  //   const handleSubmit = async (e) => {
  //     console.log("dhsaidbh");
  //     e.preventDefault();

  //     if (!validate()) return;

  //     try {
  //       setLoading(true);
  //       setSuccess("");

  //       const res = await fetch("/api/contact", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(form),
  //       });

  //       const data = await res.json();

  //       if (!res.ok) throw new Error(data.message);

  //       setSuccess("Message sent successfully ✅");

  //       // reset form
  //       setForm({
  //         name: "",
  //         email: "",
  //         topic: "",
  //         message: "",
  //         consent: false,
  //       });
  //     } catch (err) {
  //       console.log(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    let body = {
      name: form.name,
      emailAddress: form.email,
      phoneNumber: form.phone,
      topic: form.topic,
      queryDetail: form.message,
      marketingPreference: form.consent,
    };
    let res = await CreateContact(body);
    if (res?.data && res?.data?.id && res?.data?.id > 0) {
      setForm({
        name: "",
        email: "",
        topic: "",
        message: "",
        consent: false,
      });
      toast.success(
        "Thank you for getting in touch! We appreciate you contacting us!",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        },
      );
    } else {
      toast.error(res?.data, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <>
      <Header />
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
                <div className="error" id="error"></div>
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
                    <button className="btn" id="sendBtn" type="submit">
                      Send Message
                    </button>
                  </div>
                </div>
                <div className="success" id="success">
                  <button disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                  <div id="successText"></div>
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
