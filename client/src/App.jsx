import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store";
import { getMe } from "./store/slices/authSlice";
import { fetchProjects } from "./store/slices/projectSlice";
import { Toaster } from "sonner";

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
              <div className="text-center py-20">
                <h1 className="text-2xl font-bold gradient-text mb-4">
                  Welcome to Dionysus
                </h1>
                <p className="text-muted-foreground">
                  Create your first project using the sidebar to get started!
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
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.17 0 0)",
              border: "1px solid oklch(0.3 0 0)",
              color: "oklch(0.985 0 0)",
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}
