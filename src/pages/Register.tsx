import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { RegisterData } from "@/types";
import { useAuth } from "@/context";
import { PageCard, PageToolbar } from "@/components";

const Register = () => {
  const { t } = useTranslation();
  const { signedIn, handleRegister, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  // ✨ NEW: Inline error handling and success state management
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formState, setForm] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  });

  const { email, password, confirmPassword, role } = formState;

  // ✨ Delayed redirection hook to give visual breathing room for the success message
  useEffect(() => {
    if (isSuccess && signedIn) {
      const timer = setTimeout(() => {
        if (user?.roles?.includes("doctor")) {
          navigate("/doctor/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1500); // 1.5 second hold

      return () => clearTimeout(timer);
    }
  }, [isSuccess, signedIn, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear out active feedback errors as inputs are updated
    if (formError) setFormError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (formError) setFormError(null);
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value as "patient" | "doctor",
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!email || !password || !confirmPassword)
        throw new Error(t("register.requiredError"));
      if (password !== confirmPassword)
        throw new Error(t("register.matchError"));

      setLoading(true);
      setFormError(null);

      await handleRegister({
        email,
        password,
        confirmPassword,
        role,
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      setFormError(message);
      setLoading(false); // Only release loading lock on catch
    }
  };

  // ⚠️ Modified conditional: Prevent snapping out of the page layout before success completes
  if (signedIn && !isSuccess) {
    if (user?.roles?.includes("doctor")) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <PageCard size="sm">
      <PageToolbar title={t("register.title")} />

      {/* ✨ Swaps context when an authentication sequence maps successfully */}
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
              {t("register.successMessage")}
            </h3>
            <p className="text-sm text-base-content/60">
              Creating your medical dashboard access profile...
            </p>
          </div>
          <div className="loading loading-dots loading-md text-primary mt-2"></div>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* ✨ Beautiful, Context-Aware Inline Notification Banner */}
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
            className={`input rounded-xl w-full flex items-center gap-2 border bg-base-100 focus-within:border-primary ${formError ? "border-error" : "border-base-content/30"}`}
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
              placeholder={t("register.emailPlaceholder")}
            />
          </label>

          <label
            className={`input rounded-xl w-full flex items-center gap-2 border bg-base-100 focus-within:border-primary ${formError ? "border-error" : "border-base-content/30"}`}
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
              placeholder={t("register.passwordPlaceholder")}
            />
          </label>

          <label
            className={`input rounded-xl w-full flex items-center gap-2 border bg-base-100 focus-within:border-primary ${formError ? "border-error" : "border-base-content/30"}`}
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
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              type="password"
              className="grow"
              placeholder={t("register.confirmPlaceholder")}
            />
          </label>

          <div className="form-control w-full mt-1 text-left">
            <label className="label pt-0 pb-1.5">
              <span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">
                {t("register.accountCategory")}
              </span>
            </label>
            <select
              name="role"
              value={role}
              onChange={handleSelectChange}
              className="select select-bordered w-full text-sm font-semibold border-base-200 focus:outline-primary bg-base-100 rounded-xl"
            >
              <option value="patient">{t("register.patientOption")}</option>
              <option value="doctor">{t("register.doctorOption")}</option>
            </select>
          </div>

          <small className="text-left">
            {t("register.haveAccountPrompt")}{" "}
            <Link to="/login" className="text-primary hover:underline">
              {t("register.loginLink")}
            </Link>
          </small>

          <button
            className={`btn btn-primary self-center rounded-xl px-8 min-w-[120px] ${loading ? "btn-disabled opacity-70" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              t("register.submitBtn")
            )}
          </button>
        </form>
      )}
    </PageCard>
  );
};

export default Register;
