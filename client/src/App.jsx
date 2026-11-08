import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store";
import { getMe } from "./store/slices/authSlice";
import { fetchProjects } from "./store/slices/projectSlice";
import { Toaster } from "sonner";

import { ThemeProvider } from "./components/theme/ThemeProvider";
import AppShell from "./components/layout/AppShell";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProjectHome from "./pages/ProjectHome";
import Documentation from "./pages/Documentation";
import QnA from "./pages/QnA";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import FileVisualisation from "./pages/FileVisualisation";
import ProjectHealth from "./pages/ProjectHealth";

function ProtectedRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }) {
  const { token } = useSelector((state) => state.auth);
  if (token) return <Navigate to="/" replace />;
  return children;
}

function RootRoute() {
  const { token } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.project);

  if (!token) {
    return <LandingPage />;
  }

  if (projects.length > 0) {
    return <Navigate to={`/projects/${projects[0]._id}`} replace />;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-16 animate-fade-up">
        <div className="p-6 rounded-lg border border-border bg-card space-y-3">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
            Workspace Initialized
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome to Dionysus
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Create or select a project from the sidebar to explore repository architecture, analyze meeting audio, and query technical documentation.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function AppRoutes() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

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
      {/* Root route: Landing Page for guests, Project Workspace for users */}
      <Route path="/" element={<RootRoute />} />

      {/* Public auth routes */}
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

      {/* Protected application workspace routes */}
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
        path="/projects/:id/health"
        element={
          <ProtectedRoute>
            <ProjectHealth />
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
                fontSize: "12px",
              },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
