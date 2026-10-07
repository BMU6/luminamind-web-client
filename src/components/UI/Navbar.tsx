import { Link, NavLink } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "@/context";
import ThemeSwitcher from "./ThemeSwitcher";

const Navbar = () => {
  const { handleSignOut, signedIn, loading, user } = useAuth();

  const isPatient = user?.roles?.includes("patient");
  const isDoctor = user?.roles?.includes("doctor");

  const handleLogout = async () => {
    try {
      await handleSignOut();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error logging out");
      }
    }
  };
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          LuminaMind
          <span role="img" aria-labelledby="heart">
            ❤️
          </span>
        </Link>
      </div>
      <div className="flex-none flex items-center">
        {user && <p>{`Welcome back, ${user.email}`}</p>}
        <ThemeSwitcher />
        <ul className="menu menu-horizontal px-1 [&_a.active]:text-secondary! [&_li>*:not(.active):hover]:text-base-content/60 [&_li>*]:transition-colors">
          {!loading &&
            (signedIn ? (
              <>
                {/* NEW: Render tracking pathways exclusively for Patient profiles */}
                {isPatient && (
                  <>
                    <li>
                      <NavLink to="/">Home</NavLink>
                    </li>
                    <li>
                      <NavLink to="/reports">Reports</NavLink>
                    </li>
                    <li>
                      <NavLink to="/medicationlist">Medication List</NavLink>
                    </li>
                  </>
                )}

                {/* NEW: Render management layout tools exclusively for Doctor profiles */}
                {isDoctor && (
                  <li>
                    <NavLink to="/doctor/dashboard">Dashboard</NavLink>
                  </li>
                )}

                {/* NEW: Shared interactive Chat channel unlocked for both roles */}
                <li>
                  <NavLink to="/chat">Messages</NavLink>
                </li>

                <li>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm font-bold text-error"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/register">Register</NavLink>
                </li>
                <li>
                  <NavLink to="/login">Login</NavLink>
                </li>
              </>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
