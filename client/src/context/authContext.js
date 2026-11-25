/*
 * ============================================================
 * File Name     : authContext.js
 * Description   : Defines the shared authentication context and hook.
 * Module        : Authentication
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/*
 * ============================================================
 * Function Name : useAuth
 * Description   : Reads the nearest authentication context.
 * Input         : None.
 * Output        : Current user, loading state, and authentication actions.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
