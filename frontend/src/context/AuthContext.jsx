import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authApi from "../api/auth.js";
import { getToken } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const logout = useCallback(() => {
    authApi.logout();
    setTokenState(null);
    setUser(null);
    setAuthError(null);
  }, []);

  const loadUser = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      if (res?.success && res?.user) {
        setUser(res.user);
        setAuthError(null);
      } else {
        logout();
      }
    } catch (err) {
      console.warn("Failed to restore session:", err?.message);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadUser();

    const handleAuthError = () => {
      logout();
    };

    window.addEventListener("arsam:auth_error", handleAuthError);
    return () => {
      window.removeEventListener("arsam:auth_error", handleAuthError);
    };
  }, [loadUser, logout]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      if (res?.success && res?.token) {
        setTokenState(res.token);
        setUser(res.user);
        return res.user;
      }
      throw new Error(res?.message || "Échec de connexion");
    } catch (err) {
      setAuthError(err.message || "Identifiants invalides");
      throw err;
    }
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const canManageChantiers = user?.role === "admin" || user?.role === "manager";
  const canDeleteChantiers = user?.role === "admin";
  const canAccessMaterials = Boolean(user);
  const canManageMaterials = user?.role === "admin" || user?.role === "manager";
  const canDeleteMaterials = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        authError,
        login,
        logout,
        refreshUser: loadUser,
        hasRole,
        canManageChantiers,
        canDeleteChantiers,
        canAccessMaterials,
        canManageMaterials,
        canDeleteMaterials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
