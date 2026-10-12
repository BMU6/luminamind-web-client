import { useState } from "react";
import { Link, Navigate } from "react-router";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next"; // Core Translation framework hook
import type { RegisterData } from "@/types";
import { useAuth } from "@/context";
import { PageCard, PageToolbar } from "@/components";

const Register = () => {
  const { t } = useTranslation(); // Pulls the translation lookup handle
  const { signedIn, handleRegister, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Initialized form state with type-safe 'role' parameter defaulting to patient
  const [formState, setForm] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  });

  const { email, password, confirmPassword, role } = formState;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value as "patient" | "doctor",
    }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!email || !password || !confirmPassword)
        throw new Error(t("register.requiredError"));
      if (password !== confirmPassword)
        throw new Error(t("register.matchError"));

      setLoading(true);
      await handleRegister({
        email,
        password,
        confirmPassword,
        role,
      });
      toast.success(t("register.successMessage"));
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (signedIn) {
    if (user?.roles?.includes("doctor")) {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <PageCard size="sm">
      <PageToolbar title={t("register.title")} />
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            placeholder={t("register.emailPlaceholder")}
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
            placeholder={t("register.passwordPlaceholder")}
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
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            type="password"
            className="grow"
            placeholder={t("register.confirmPlaceholder")}
          />
        </label>

        {/* Dropdown Input Selection for Role Mapping */}
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
          className="btn btn-primary self-center rounded-xl px-8"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            t("register.submitBtn")
          )}
        </button>
      </form>
    </PageCard>
  );
};

export default Register;
