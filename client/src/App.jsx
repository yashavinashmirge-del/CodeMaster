/*
 * ============================================================
 * File Name     : App.jsx
 * Description   : Defines CodeMaster public, student, and staff routes.
 * Module        : Frontend Application
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */

import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/authContext.js";
import AuthPage from "./pages/AuthPage.jsx";
import OAuthCallbackPage from "./pages/OAuthCallbackPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import { AnalyticsPage, AssistantPage, BookmarksPage, DashboardPage, DryRunPage, LearningDetailPage, LibraryPage, PracticePage, SubmissionsPage, WorkspaceLayout } from "./pages/Workspace.jsx";
import { AdminDashboardPage, ContentStudioPage, SuperAdminUsersPage } from "./pages/AdminPages.jsx";

/*
 * ============================================================
 * Function Name : SessionRoute
 * Description   : Waits for session restoration and protects workspace pages.
 * Input         : Route element and optional allowed roles.
 * Output        : Authorized content or navigation to the correct route.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function SessionRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-page"><div className="loading-state" role="status">Restoring your CodeMaster session…</div></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

/*
 * ============================================================
 * Function Name : DashboardRoute
 * Description   : Shows role-appropriate dashboard content.
 * Input         : Current authenticated user role.
 * Output        : Student dashboard or staff content overview.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function DashboardRoute() {
  const { user } = useAuth();
  return user.role === "student" ? <DashboardPage /> : <AdminDashboardPage />;
}

/*
 * ============================================================
 * Function Name : NotFoundPage
 * Description   : Gives visitors a safe route back from an unknown URL.
 * Input         : None.
 * Output        : A compact not-found page with working navigation.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function NotFoundPage() {
  const { user } = useAuth();
  return <main className="auth-page"><section className="auth-panel not-found-panel"><span className="page-kicker">404 / PAGE NOT FOUND</span><h1>This route isn’t here.</h1><p className="auth-intro">The page may have moved or the address may be incomplete.</p><a className="primary-cta" href={user ? "/dashboard" : "/"}>Return to CodeMaster</a></section></main>;
}

/*
 * ============================================================
 * Function Name : RouteTree
 * Description   : Declares the public, authenticated, and role-restricted UI.
 * Input         : None.
 * Output        : React Router route hierarchy.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
function RouteTree() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
    <Route element={<SessionRoute><WorkspaceLayout /></SessionRoute>}>
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/languages" element={<LibraryPage kind="language" />} />
      <Route path="/topics" element={<LibraryPage kind="topic" />} />
      <Route path="/lessons" element={<LibraryPage kind="lesson" />} />
      <Route path="/notes" element={<LibraryPage kind="note" />} />
      <Route path="/learn/:itemId" element={<LearningDetailPage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/practice/:itemId" element={<PracticePage />} />
      <Route path="/dry-run" element={<DryRunPage />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/submissions" element={<SubmissionsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/admin/content" element={<SessionRoute roles={["admin", "superadmin"]}><ContentStudioPage /></SessionRoute>} />
      <Route path="/superadmin/users" element={<SessionRoute roles={["superadmin"]}><SuperAdminUsersPage /></SessionRoute>} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}

/*
 * ============================================================
 * Function Name : App
 * Description   : Mounts the shared authentication and route providers.
 * Input         : None.
 * Output        : Complete CodeMaster browser application.
 * Author        : Your Name
 * Date          : 23/11/2026
 * ============================================================
 */
export default function App() {
  return <AuthProvider><RouteTree /></AuthProvider>;
}
