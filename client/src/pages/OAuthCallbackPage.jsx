/*
 * ============================================================
 * File Name     : OAuthCallbackPage.jsx
 * Description   : Verifies the session returned after provider sign-in.
 * Module        : Authentication
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Terminal } from "lucide-react";
import { useAuth } from "../context/authContext.js";

const callbackErrors = {
  google_not_configured: "Google sign-in is not configured on the CodeMaster server yet.",
  github_not_configured: "GitHub sign-in is not configured on the CodeMaster server yet.",
  oauth_cancelled: "Sign-in was cancelled. You can try again or use email and password.",
  account_deactivated: "This CodeMaster account has been deactivated.",
  oauth_failed: "Sign-in could not be completed. Check that your provider account has a verified email and try again.",
};

/*
 * ============================================================
 * Function Name : OAuthCallbackPage
 * Description   : Validates the one-time OAuth session and completes login.
 * Input         : Provider callback token in the URL fragment, if successful.
 * Output        : Dashboard redirect or recovery link with a readable error.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export default function OAuthCallbackPage() {
  const { authenticateToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackPromise = useRef(null);
  const [error, setError] = useState(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = sessionStorage.getItem("codemaster-oauth-token") || fragment.get("token");
    return token ? "" : callbackErrors[fragment.get("error")] || "The sign-in response was incomplete. Please try again.";
  });
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  useEffect(() => {
    let active = true;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = sessionStorage.getItem("codemaster-oauth-token") || fragment.get("token");
    // Remove the session token from the address bar before calling the API.
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    if (!token) {
      return () => { active = false; };
    }

    sessionStorage.setItem("codemaster-oauth-token", token);
    callbackPromise.current ||= authenticateToken(token);
    callbackPromise.current
      .then(() => { if (active) navigate("/dashboard", { replace: true }); })
      .catch(() => { if (active) setError("CodeMaster could not verify your sign-in. Check that the backend is running and try again."); })
      .finally(() => sessionStorage.removeItem("codemaster-oauth-token"));
    return () => { active = false; };
  }, [authenticateToken, navigate]);

  return (
    <main className="auth-page">
      <section className="auth-panel oauth-callback-panel">
        <Link to="/" className="landing-brand"><span className="landing-brand-icon"><Terminal size={18} /></span><span>CodeMaster<small>LEARN BY DOING</small></span></Link>
        {error ? <><h1>Sign-in didn’t finish.</h1><p className="auth-intro" role="alert">{error}</p><Link className="primary-cta oauth-retry-link" to={mode === "register" ? "/register" : "/login"}><ArrowLeft size={15} />Back to {mode === "register" ? "create account" : "login"}</Link></> : <><h1>Signing you in.</h1><p className="auth-intro" role="status">CodeMaster is verifying your provider account…</p></>}
      </section>
    </main>
  );
}
