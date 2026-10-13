import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import type { LoginData } from "@/types";
import { useAuth } from "@/context";
import { PageCard, PageToolbar } from "@/components";

const Login = () => {
  const { signedIn, handleSignIn, user } = useAuth();
  const { t } = useTranslation();

  const from = useLocation().state?.from?.pathname ?? "/";
  const [{ email, password }, setForm] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // Localized alert text banner state tracking replaces global toast
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage(null); // Clear errors dynamically on type
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (!email || !password) throw new Error(t("login.requiredError"));
      setLoading(true);

      await handleSignIn({ email, password });
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      setErrorMessage(message); // Sets the error directly to the local view panel
    } finally {
      setLoading(false);
    }
  };

  if (signedIn) {
    if (user?.roles?.includes("doctor")) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to={from} replace />;
  }

  return (
    <PageCard size="sm">
      <PageToolbar title={t("login.title")} />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Inline Component Alert Box matches Screenshot 2 styling */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl text-left animate-fadeIn"
          >
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}
        <label className="input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary">
          <svg
            xmlns="http://w3.org"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
            <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
          </svg>
          <input
            name="email"
            value={email}
            onChange={handleChange}
            type="email"
            className="grow"
            placeholder={t("login.emailPlaceholder")}
          />
        </label>
        <label className="input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary">
          <svg
            xmlns="http://w3.org"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            name="password"
            value={password}
            onChange={handleChange}
            type="password"
            className="grow"
            placeholder={t("login.passwordPlaceholder")}
          />
        </label>
        <small className="text-left">
          {t("login.noAccountPrompt")}{" "}
          <Link to="/register" className="text-primary hover:underline">
            {t("login.registerLink")}
          </Link>
        </small>
        <button
          className="btn btn-primary self-center rounded-xl px-8"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            t("login.loginBtn")
          )}
        </button>
      </form>
    </PageCard>
  );
};

export default Login;
