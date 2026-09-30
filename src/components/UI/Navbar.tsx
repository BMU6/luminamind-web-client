import { Link, NavLink } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "@/context";

const Navbar = () => {
  const { handleSignOut, signedIn, user } = useAuth();

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
        <ul className="menu menu-horizontal px-1">
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          {signedIn ? (
            <>
              <li>
                <NavLink to="/medicationlist">Medication List</NavLink>
              </li>
              <li>
                <button onClick={handleLogout}>Logout</button>
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
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
