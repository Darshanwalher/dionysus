import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store";
import { getMe } from "./store/slices/authSlice";
import { fetchProjects } from "./store/slices/projectSlice";
import { Toaster } from "sonner";

import { ThemeProvider } from "./components/theme/ThemeProvider";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProjectHome from "./pages/ProjectHome";
import Documentation from "./pages/Documentation";
import QnA from "./pages/QnA";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import FileVisualisation from "./pages/FileVisualisation";

function ProtectedRoute({ children }) {
  const { token, isLoading } = useSelector((state) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  if (token) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.project);

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [token, user, dispatch]);

  useEffect(() => {
    if (token && user) {
      dispatch(fetchProjects());
    }
  }, [token, user, dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {projects.length > 0 ? (
              <Navigate to={`/projects/${projects[0]._id}`} replace />
            ) : (
              <div className="mx-auto max-w-xl py-16 animate-fade-up">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  New workspace
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight gradient-text">
                  Welcome to Dionysus
                </h1>
                <div className="gold-line my-6 max-w-xs" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Create your first project from the sidebar to open documentation,
                  codebase Q&amp;A, and meeting intelligence in one editorial workspace.
                </p>
              </div>
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/documentation"
        element={
          <ProtectedRoute>
            <Documentation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/qna"
        element={
          <ProtectedRoute>
            <QnA />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/meetings"
        element={
          <ProtectedRoute>
            <Meetings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/meetings/:meetingId"
        element={
          <ProtectedRoute>
            <MeetingDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/visualise"
        element={
          <ProtectedRoute>
            <FileVisualisation />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
