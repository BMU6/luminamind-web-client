import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "@/context";
import { PageCard, PageToolbar } from "@/components";

const Register = () => {
  const { signedIn, user, handleRegister } = useAuth();
  const location = useLocation();

  // Track your form input fields including the role dropdown selector selection
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    try {
      setLoading(true);
      // Fire your unified context registration sequence
      await handleRegister({ email, password, confirmPassword, role });
      toast.success("Account created successfully!");
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      toast.error(message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic landing pad control for completed account entries
  if (signedIn) {
    let redirectDestination = location.state?.from?.pathname;

    if (!redirectDestination) {
      if (user?.roles?.includes("doctor")) {
        redirectDestination = "/doctor/dashboard";
      } else {
        redirectDestination = "/";
      }
    }
    return <Navigate to={redirectDestination} replace />;
  }

  return (
    <PageCard size="sm">
      <PageToolbar title="Register" />
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="grow"
            required
          />
        </label>

        <label className="input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="grow"
            required
          />
        </label>

        <label className="input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="grow"
            required
          />
        </label>

        {/* Role selection element layout block using standard DaisyUI component utility classes */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Account Category</span>
          </label>
          <select
            className="select select-bordered rounded-xl w-full bg-base-100"
            value={role}
            onChange={(e) => setRole(e.target.value as "patient" | "doctor")}
          >
            <option value="patient">Patient (Track Metrics & Progress)</option>
            <option value="doctor">
              Clinician / Doctor (Monitor Patients)
            </option>
          </select>
        </div>

        <small>
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login!
          </Link>
        </small>

        <button
          className="btn btn-primary self-center rounded-xl px-8"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Register"
          )}
        </button>
      </form>
    </PageCard>
  );
};

export default Register;
