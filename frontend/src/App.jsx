import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";

// Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ChantiersList from "./pages/Chantiers/ChantiersList.jsx";
import MaterialsList from "./pages/Materials/MaterialsList.jsx";
import NotFound from "./pages/NotFound.jsx";

// Protected Route Guard
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner
          message="Vérification de la session en cours..."
          size="lg"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="chantiers" element={<ChantiersList />} />
            <Route path="materiaux" element={<MaterialsList />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
