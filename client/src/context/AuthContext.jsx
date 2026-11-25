/*
 * ============================================================
 * File Name     : AuthContext.jsx
 * Description   : Shares sign-in state and actions across the app.
 * Module        : Authentication
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { AuthContext } from "./authContext.js";

/*
 * ============================================================
 * Function Name : AuthProvider
 * Description   : Restores the current session and provides auth actions.
 * Input         : React child components.
 * Output        : An authentication context for descendants.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("codemaster-token")));

  const logout = useCallback(() => {
    localStorage.removeItem("codemaster-token");
    setUser(null);
  }, []);

  useEffect(() => {
    let current = true;
    const token = localStorage.getItem("codemaster-token");
    if (!token) {
      return undefined;
    }
    api.get("/auth/me")
      .then(({ data }) => { if (current) setUser(data.user); })
      .catch(() => { if (current) logout(); })
      .finally(() => { if (current) setLoading(false); });
    const expire = () => logout();
    window.addEventListener("codemaster:session-expired", expire);
    return () => {
      current = false;
      window.removeEventListener("codemaster:session-expired", expire);
    };
  }, [logout]);

  /*
   * ============================================================
   * Function Name : authenticate
   * Description   : Signs in or registers, then stores the returned session.
   * Input         : Mode and validated account credentials.
   * Output        : Authenticated user record.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const authenticate = useCallback(async (mode, values) => {
    const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
    const { data } = await api.post(endpoint, values);
    localStorage.setItem("codemaster-token", data.token);
    setUser(data.user);
    return data.user;
  }, []);

  /*
   * ============================================================
   * Function Name : authenticateToken
   * Description   : Validates a provider-issued CodeMaster session token.
   * Input         : JWT received by the OAuth callback page.
   * Output        : Authenticated user record or a rejected API request.
   * Author        : Your Name
   * Date          : 23/11/2026
   * ============================================================
   */
  const authenticateToken = useCallback(async (token) => {
    localStorage.setItem("codemaster-token", token);
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (error) {
      localStorage.removeItem("codemaster-token");
      setLoading(false);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({ user, loading, authenticate, authenticateToken, logout }), [user, loading, authenticate, authenticateToken, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

