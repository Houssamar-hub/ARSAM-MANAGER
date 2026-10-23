import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HardHat, Mail, Lock, User, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import authApi from "../api/auth.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import ErrorAlert from "../components/common/ErrorAlert.jsx";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setFieldErrors({});
    setServerError(null);
    setSuccessMessage(null);
  };

  const validate = () => {
    const errors = {};

    if (mode === "register") {
      if (!name.trim()) {
        errors.name = "Le nom complet est requis";
      } else if (name.trim().length < 2) {
        errors.name = "Le nom doit comporter au moins 2 caractères";
      }
    }

    if (!email.trim()) {
      errors.email = "L'adresse email est requise";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Format d'adresse email invalide";
    }

    if (!password) {
      errors.password = "Le mot de passe est requis";
    } else if (mode === "register" && password.length < 8) {
      errors.password = "Le mot de passe doit comporter au moins 8 caractères";
    }

    if (mode === "register") {
      if (!confirmPassword) {
        errors.confirmPassword = "La confirmation du mot de passe est requise";
      } else if (confirmPassword !== password) {
        errors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      if (mode === "register") {
        // Call register API
        const regRes = await authApi.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (!regRes?.success) {
          throw new Error(regRes?.message || "Échec de l'enregistrement");
        }

        setSuccessMessage("Compte créé avec succès ! Connexion automatique...");

        // Auto-login after registration
        await login(email.trim(), password);
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        // Standard login
        await login(email.trim(), password);
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      setServerError(
        err.message ||
          (mode === "register"
            ? "Erreur lors de la création du compte."
            : "Échec d'authentification. Veuillez vérifier vos identifiants.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Company Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-100">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
              <HardHat className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              ARSAM MANAGER
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
              ARSAM TRAVAUX SARL • BTP & Génie Civil
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {mode === "login"
                ? "Connectez-vous pour accéder à votre espace de gestion"
                : "Créez votre compte pour rejoindre l'équipe ARSAM TRAVAUX"}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Connexion</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un compte</span>
            </button>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs font-medium text-emerald-800 text-center">
              {successMessage}
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5">
              <ErrorAlert
                title={mode === "register" ? "Erreur d'inscription" : "Erreur de connexion"}
                message={serverError}
              />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <Input
                label="Nom complet"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="ex: Ahmed Benali"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: null }));
                  }
                }}
                error={fieldErrors.name}
                icon={User}
                required
              />
            )}

            <Input
              label="Adresse Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ex: nom@arsamtravaux.ma"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: null }));
                }
              }}
              error={fieldErrors.email}
              icon={Mail}
              required
            />

            <Input
              label="Mot de passe"
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: null }));
                }
              }}
              error={fieldErrors.password}
              helperText={
                mode === "register"
                  ? "8 caractères minimum requis"
                  : null
              }
              icon={Lock}
              required
            />

            {mode === "register" && (
              <Input
                label="Confirmer le mot de passe"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }
                }}
                error={fieldErrors.confirmPassword}
                icon={Lock}
                required
              />
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold py-3 shadow-md shadow-blue-500/20"
                isLoading={isSubmitting}
                icon={mode === "register" ? UserPlus : ArrowRight}
              >
                {mode === "register" ? "Créer mon compte" : "Se connecter"}
              </Button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="mt-6 text-center">
            {mode === "login" ? (
              <p className="text-xs text-slate-500">
                Vous n'avez pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  S'inscrire
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Vous avez déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ARSAM TRAVAUX SARL. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Login;
