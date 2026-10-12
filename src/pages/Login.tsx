import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { LoginData } from "@/types";
import { useAuth } from "@/context";
import { PageCard, PageToolbar } from "@/components";

const Login = () => {
  const { signedIn, handleSignIn, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const from = useLocation().state?.from?.pathname ?? "/";
  const [{ email, password }, setForm] = useState<LoginData>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // ✨ Delayed redirection hook to let the user read the success message
  useEffect(() => {
    if (isSuccess && signedIn) {
      const timer = setTimeout(() => {
        if (user?.roles?.includes("doctor")) {
          navigate("/doctor/dashboard", { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }, 1500); // 1.5 seconds delay

      return () => clearTimeout(timer);
    }
  }, [isSuccess, signedIn, user, from, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formError) setFormError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!email || !password) throw new Error(t("login.requiredError"));
      setLoading(true);
      setFormError(null);

      await handleSignIn({ email, password });
      setIsSuccess(true);
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      setFormError(message);
      setLoading(false);
    }
  };

  // ⚠️ Modified conditional: Don't redirect immediately if we are displaying the success transition animation
  if (signedIn && !isSuccess) {
    if (user?.roles?.includes("doctor")) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to={from} replace />;
  }

  return (
    <PageCard size="sm">
      <PageToolbar title={t("login.title")} />

      {/* ✨ Refactored layout conditional: Swaps form context for a clean success card */}
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center border border-success/20 shadow-inner">
            <svg
              xmlns="http://w3.org"
              className="h-8 w-8 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-xl text-base-content">
              {t("login.successMessage")}
            </h3>
            <p className="text-sm text-base-content/60">
              Loading your workspace layout...
            </p>
          </div>
          <div className="loading loading-dots loading-md text-primary mt-2"></div>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {formError && (
            <div className="alert alert-error rounded-xl flex items-start gap-2 bg-error/10 text-error border border-error/20 p-3 text-sm animate-fadeIn">
              <svg
                xmlns="http://w3.org"
                className="stroke-current shrink-0 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          <label
            className={`input rounded-xl w-full flex items-center gap-2 border bg-base-100 focus-within:border-primary ${
              formError ? "border-error" : "border-base-content/30"
            }`}
          >
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

          <label
            className={`input rounded-xl w-full flex items-center gap-2 border bg-base-100 focus-within:border-primary ${
              formError ? "border-error" : "border-base-content/30"
            }`}
          >
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

          <small>
            {t("login.noAccountPrompt")}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t("login.registerLink")}
            </Link>
          </small>

          <button
            className={`btn btn-primary self-center rounded-xl px-8 min-w-[120px] ${
              loading ? "btn-disabled opacity-70" : ""
            }`}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              t("login.loginBtn")
            )}
          </button>
        </form>
      )}
    </PageCard>
  );
};

export default Login;
