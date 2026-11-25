/*
 * ============================================================
 * File Name     : oauthController.js
 * Description   : Handles secure Google and GitHub login callbacks.
 * Module        : Authentication
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateToken } from "./authController.js";

const stateCookieName = "codemaster-oauth-state";
const providerSettings = {
  google: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET", callbackUrl: "GOOGLE_CALLBACK_URL" },
  github: { clientId: "GITHUB_CLIENT_ID", clientSecret: "GITHUB_CLIENT_SECRET", callbackUrl: "GITHUB_CALLBACK_URL" },
};

/*
 * ============================================================
 * Function Name : clientOrigin
 * Description   : Returns the first configured frontend origin.
 * Input         : None.
 * Output        : A frontend origin safe to use for the OAuth redirect.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const clientOrigin = () => (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();

/*
 * ============================================================
 * Function Name : callbackUrl
 * Description   : Resolves a provider callback URI from environment config.
 * Input         : Provider key and its callback URL variable name.
 * Output        : A registered OAuth callback URI.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const callbackUrl = (provider, variable) => process.env[variable] || `${(process.env.API_PUBLIC_URL || "http://localhost:5000").replace(/\/$/, "")}/api/auth/${provider}/callback`;

/*
 * ============================================================
 * Function Name : oauthRedirect
 * Description   : Sends the browser to the public OAuth callback screen.
 * Input         : Requested auth screen and a non-sensitive result code.
 * Output        : HTTP redirect to the frontend callback route.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const oauthRedirect = (res, screen, value, token = "") => {
  const destination = new URL("/auth/callback", clientOrigin());
  destination.searchParams.set("mode", screen === "register" ? "register" : "login");
  if (token) destination.hash = `token=${encodeURIComponent(token)}`;
  else destination.hash = `error=${encodeURIComponent(value)}`;
  return res.redirect(302, destination.toString());
};

/*
 * ============================================================
 * Function Name : readCookie
 * Description   : Reads one cookie without adding a cookie parser package.
 * Input         : HTTP request and cookie name.
 * Output        : Decoded cookie value, or an empty string.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const readCookie = (req, name) => {
  const prefix = `${name}=`;
  const value = (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : "";
};

/*
 * ============================================================
 * Function Name : clearStateCookie
 * Description   : Removes the one-time OAuth state cookie after a callback.
 * Input         : HTTP response.
 * Output        : Expired HTTP-only state cookie.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const clearStateCookie = (res) => res.clearCookie(stateCookieName, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth" });

/*
 * ============================================================
 * Function Name : verifyOAuthState
 * Description   : Checks signed state and matches the provider nonce.
 * Input         : HTTP request and provider-returned state value.
 * Output        : Verified login or registration screen name.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const verifyOAuthState = (req, returnedState) => {
  const signedState = readCookie(req, stateCookieName);
  if (!signedState || typeof returnedState !== "string") throw new Error("OAuth state is missing or expired.");
  const state = jwt.verify(signedState, process.env.JWT_SECRET);
  const expected = Buffer.from(String(state.nonce || ""));
  const actual = Buffer.from(returnedState);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new Error("OAuth state could not be verified.");
  return state.screen === "register" ? "register" : "login";
};

/*
 * ============================================================
 * Function Name : beginOAuth
 * Description   : Starts a provider authorization-code login flow.
 * Input         : HTTP request, response, and OAuth provider name.
 * Output        : Provider authorization redirect with signed state cookie.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const beginOAuth = (req, res, provider) => {
  const settings = providerSettings[provider];
  const screen = req.query.mode === "register" ? "register" : "login";
  const clientId = process.env[settings.clientId];
  const clientSecret = process.env[settings.clientSecret];
  if (!clientId || !clientSecret || !process.env.JWT_SECRET) return oauthRedirect(res, screen, `${provider}_not_configured`);

  const nonce = crypto.randomBytes(32).toString("base64url");
  const signedState = jwt.sign({ nonce, screen }, process.env.JWT_SECRET, { expiresIn: "10m" });
  res.cookie(stateCookieName, signedState, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
    path: "/api/auth",
  });

  const authorizationUrl = new URL(provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://github.com/login/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", callbackUrl(provider, settings.callbackUrl));
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("state", nonce);
  authorizationUrl.searchParams.set("scope", provider === "google" ? "openid email profile" : "read:user user:email");
  if (provider === "google") authorizationUrl.searchParams.set("prompt", "select_account");
  return res.redirect(302, authorizationUrl.toString());
};

/*
 * ============================================================
 * Function Name : exchangeAuthorizationCode
 * Description   : Exchanges a provider code for a short-lived API token.
 * Input         : Provider configuration, authorization code, and callback.
 * Output        : Access token returned by the provider.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const exchangeAuthorizationCode = async (provider, code) => {
  const settings = providerSettings[provider];
  const body = new URLSearchParams({
    client_id: process.env[settings.clientId],
    client_secret: process.env[settings.clientSecret],
    code,
    redirect_uri: callbackUrl(provider, settings.callbackUrl),
    grant_type: "authorization_code",
  });
  const response = await fetch(provider === "google" ? "https://oauth2.googleapis.com/token" : "https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(12000),
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error("The identity provider could not complete sign-in.");
  return result.access_token;
};

/*
 * ============================================================
 * Function Name : getProviderProfile
 * Description   : Retrieves verified identity details from the provider API.
 * Input         : Provider name and exchanged access token.
 * Output        : Verified provider ID, email, name, and avatar.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const getProviderProfile = async (provider, accessToken) => {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
  const profileResponse = await fetch(provider === "google" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://api.github.com/user", {
    headers: { ...headers, ...(provider === "github" ? { "X-GitHub-Api-Version": "2022-11-28" } : {}) },
    signal: AbortSignal.timeout(12000),
  });
  if (!profileResponse.ok) throw new Error("The identity provider did not return a profile.");
  const profile = await profileResponse.json();

  if (provider === "google") {
    if (!profile.sub || typeof profile.email !== "string" || profile.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) || profile.email_verified !== true) throw new Error("Google must return a verified email address.");
    return { id: String(profile.sub), email: profile.email, name: profile.name || profile.email.split("@")[0], avatar: profile.picture || "" };
  }

  if (!profile.id) throw new Error("GitHub did not return a valid account.");
  const emailsResponse = await fetch("https://api.github.com/user/emails", {
    headers: { ...headers, "X-GitHub-Api-Version": "2022-11-28" },
    signal: AbortSignal.timeout(12000),
  });
  if (!emailsResponse.ok) throw new Error("GitHub email permission is required to create or find your CodeMaster account.");
  const emails = await emailsResponse.json();
  const verifiedEmail = emails.find((entry) => entry.primary && entry.verified)?.email;
  if (typeof verifiedEmail !== "string" || verifiedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedEmail)) throw new Error("GitHub must provide a verified primary email address.");
  return { id: String(profile.id), email: verifiedEmail, name: profile.name || profile.login || verifiedEmail.split("@")[0], avatar: profile.avatar_url || "" };
};

/*
 * ============================================================
 * Function Name : findOrCreateOAuthUser
 * Description   : Finds or creates a student linked to verified OAuth ID.
 * Input         : Provider name and verified provider profile.
 * Output        : Active CodeMaster user with updated last-login timestamp.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const findOrCreateOAuthUser = async (provider, profile) => {
  const identityPath = `oauth.${provider}Id`;
  const selectProviders = "+oauth.googleId +oauth.githubId";
  let user = await User.findOne({ [identityPath]: profile.id }).select(selectProviders);
  if (!user) user = await User.findOne({ email: profile.email.trim().toLowerCase() }).select(selectProviders);
  if (user && !user.isActive) {
    const error = new Error("This CodeMaster account has been deactivated.");
    error.statusCode = 403;
    throw error;
  }

  if (!user) {
    const providerName = typeof profile.name === "string" ? profile.name.trim().slice(0, 60) : "";
    const safeName = providerName.length >= 2 ? providerName : "Student";
    user = new User({
      name: safeName,
      email: profile.email.trim().toLowerCase(),
      password: crypto.randomBytes(48).toString("base64url"),
      role: "student",
      oauth: { [`${provider}Id`]: profile.id },
      profile: { avatar: profile.avatar },
    });
  } else {
    user.oauth ??= {};
    if (user.oauth[`${provider}Id`] && user.oauth[`${provider}Id`] !== profile.id) {
      const error = new Error("This email is already connected to a different provider account.");
      error.statusCode = 409;
      throw error;
    }
    user.oauth[`${provider}Id`] = profile.id;
    if (!user.profile?.avatar && profile.avatar) user.profile.avatar = profile.avatar;
  }
  user.lastLogin = new Date();
  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      const linkedUser = await User.findOne({ [identityPath]: profile.id });
      if (linkedUser?.isActive) return linkedUser;
    }
    throw error;
  }
  return user;
};

/*
 * ============================================================
 * Function Name : startGoogleOAuth
 * Description   : Begins Google sign-in or student registration.
 * Input         : Express HTTP request and response.
 * Output        : Redirect to Google's authorization screen.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const startGoogleOAuth = (req, res) => beginOAuth(req, res, "google");

/*
 * ============================================================
 * Function Name : startGitHubOAuth
 * Description   : Begins GitHub sign-in or student registration.
 * Input         : Express HTTP request and response.
 * Output        : Redirect to GitHub's authorization screen.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const startGitHubOAuth = (req, res) => beginOAuth(req, res, "github");

/*
 * ============================================================
 * Function Name : finishOAuth
 * Description   : Validates provider identity and issues a CodeMaster JWT.
 * Input         : Express request, response, and OAuth provider name.
 * Output        : Frontend callback redirect with session token in URL fragment.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
const finishOAuth = async (req, res, provider) => {
  let screen = "login";
  try {
    screen = verifyOAuthState(req, req.query.state);
    if (req.query.error) return oauthRedirect(res, screen, "oauth_cancelled");
    if (typeof req.query.code !== "string" || req.query.code.length > 2048) throw new Error("The identity provider did not return a valid authorization code.");
    const accessToken = await exchangeAuthorizationCode(provider, req.query.code);
    const profile = await getProviderProfile(provider, accessToken);
    const user = await findOrCreateOAuthUser(provider, profile);
    return oauthRedirect(res, screen, "", generateToken(user._id));
  } catch (error) {
    console.error(`${provider} sign-in failed:`, error.message);
    if (error.statusCode) screen = screen || "login";
    return oauthRedirect(res, screen, error.statusCode === 403 ? "account_deactivated" : "oauth_failed");
  } finally {
    clearStateCookie(res);
  }
};

/*
 * ============================================================
 * Function Name : finishGoogleOAuth
 * Description   : Completes Google sign-in after its authorization callback.
 * Input         : Express HTTP request and response.
 * Output        : Redirect to CodeMaster with an authenticated session.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const finishGoogleOAuth = (req, res) => finishOAuth(req, res, "google");

/*
 * ============================================================
 * Function Name : finishGitHubOAuth
 * Description   : Completes GitHub sign-in after its authorization callback.
 * Input         : Express HTTP request and response.
 * Output        : Redirect to CodeMaster with an authenticated session.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export const finishGitHubOAuth = (req, res) => finishOAuth(req, res, "github");
