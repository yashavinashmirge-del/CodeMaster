/*
 * ============================================================
 * File Name     : AuthPage.jsx
 * Description   : Provides validated registration and login forms.
 * Module        : Authentication
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Code2, Earth, Terminal } from "lucide-react";
import { useAuth } from "../context/authContext.js";
import api from "../services/api.js";

/*
 * ============================================================
 * Function Name : AuthPage
 * Description   : Signs students in or creates student accounts.
 * Input         : Page mode from the URL and current auth context.
 * Output        : Accessible auth form with validation and error states.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export default function AuthPage({ mode }) {
  const { user, loading, authenticate } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const registering = mode === "register";

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  /*
   * ============================================================
   * Function Name : handleSubmit
   * Description   : Validates form fields and sends credentials to the API.
   * Input         : Browser form submit event.
   * Output        : Authenticated route navigation or a useful error message.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (registering && values.name.trim().length < 2) return setError("Enter your name using at least two characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return setError("Enter a valid email address.");
    if (values.password.length < 8) return setError("Your password must contain at least eight characters.");
    setBusy(true);
    try {
      await authenticate(mode, { ...values, name: values.name.trim(), email: values.email.trim().toLowerCase() });
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "CodeMaster could not reach the server. Check that the backend is running.");
    } finally {
      setBusy(false);
    }
  };

  /*
   * ============================================================
   * Function Name : beginProviderSignIn
   * Description   : Starts server-side OAuth for login or registration.
   * Input         : Google or GitHub provider key.
   * Output        : Full-page redirect to the backend OAuth start route.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const beginProviderSignIn = (provider) => {
    setError("");
    const apiBase = api.defaults.baseURL.replace(/\/$/, "");
    window.location.assign(`${apiBase}/auth/${provider}?mode=${registering ? "register" : "login"}`);
  };

  return (
    <main className="auth-page">
      <Link className="auth-back" to="/"><ArrowLeft size={15} /> Back to CodeMaster</Link>
      <section className="auth-panel">
        <Link to="/" className="landing-brand"><span className="landing-brand-icon"><Terminal size={18} /></span><span>CodeMaster<small>LEARN BY DOING</small></span></Link>
        <h1>{registering ? "Start learning." : "Welcome back."}</h1>
        <p className="auth-intro">{registering ? "Create a free student account and keep your learning in one place." : "Sign in to continue where you left off."}</p>
        <div className="auth-social-actions" aria-label="Continue with a provider">
          <button className="auth-social-button" type="button" onClick={() => beginProviderSignIn("google")}><Earth size={17} />Continue with Google</button>
          <button className="auth-social-button" type="button" onClick={() => beginProviderSignIn("github")}><Code2 size={17} />Continue with GitHub</button>
        </div>
        <div className="auth-divider"><span>or use email</span></div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {registering && <label>Name<input autoComplete="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} required maxLength={60} /></label>}
          <label>Email address<input type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required maxLength={254} /></label>
          <label>Password<input type="password" autoComplete={registering ? "new-password" : "current-password"} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} required minLength={8} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-cta auth-submit" type="submit" disabled={busy}>{busy ? "Connecting…" : registering ? "Create student account" : "Log in"}<ArrowUpRight size={16} /></button>
        </form>
        <p className="auth-switch">{registering ? "Already registered?" : "New to CodeMaster?"} <Link to={registering ? "/login" : "/register"}>{registering ? "Log in" : "Create an account"}</Link></p>
        <p className="auth-note">Student registration is open. Admin accounts are created by a Super Admin.</p>
      </section>
    </main>
  );
}
