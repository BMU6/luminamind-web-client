import { Link, NavLink } from "react-router";
import { toast } from "react-toastify";
import { useAuth } from "@/context";
import { useTranslation } from "react-i18next";
import ThemeSwitcher from "./ThemeSwitcher";

const Navbar = () => {
  const { handleSignOut, signedIn, loading, user } = useAuth();
  const { t, i18n } = useTranslation();

  const isPatient = user?.roles?.includes("patient");
  const isDoctor = user?.roles?.includes("doctor");

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

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
    <div className="navbar bg-base-100 shadow-sm border-b border-base-200 px-6 py-3 min-h-[4.5rem]">
      {/* BRAND LOGO SPACE */}
      <div className="navbar-start w-auto flex-none">
        <Link
          to={isDoctor ? "/doctor/dashboard" : "/"}
          className="btn btn-ghost text-xl font-bold gap-2 px-2 hover:bg-transparent"
        >
          LuminaMind
          <span role="img" aria-labelledby="heart">
            ❤️
          </span>
        </Link>
      </div>

      {/* RIGHT SIDE ALIGNED CONTROLS CONTAINER */}
      <div className="navbar-end flex-1 flex items-center justify-end gap-6">
        {user && (
          <p className="text-xs font-semibold opacity-60 hidden xl:block border-r border-base-300 pr-6">
            {`${t("navbar.greeting")}, ${user.email}`}
          </p>
        )}

        {/* NAVIGATION LINKS TIMELINE */}
        <ul className="menu menu-horizontal px-1 [&_a.active]:bg-primary [&_a.active]:text-primary-content! [&_li>*:not(.active):hover]:text-base-content/70 [&_li>*]:transition-colors gap-1.5 font-medium shrink-0">
          {!loading &&
            (signedIn ? (
              <>
                {!isDoctor && (
                  <li>
                    <NavLink to="/">{t("navbar.home")}</NavLink>
                  </li>
                )}

                {isPatient && (
                  <>
                    <li>
                      <NavLink to="/reports">{t("navbar.reports")}</NavLink>
                    </li>
                    <li>
                      <NavLink to="/medicationlist">
                        {t("navbar.medicationList")}
                      </NavLink>
                    </li>
                  </>
                )}

                {isDoctor && (
                  <li>
                    <NavLink to="/doctor/dashboard">
                      {t("navbar.dashboard")}
                    </NavLink>
                  </li>
                )}

                <li>
                  <NavLink to="/chat">{t("navbar.messages")}</NavLink>
                </li>

                <li>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm font-bold text-error rounded-xl hover:bg-error/10 transition-colors"
                  >
                    {t("navbar.logout")}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/register">{t("navbar.register")}</NavLink>
                </li>
                <li>
                  <NavLink to="/login">{t("navbar.login")}</NavLink>
                </li>
              </>
            ))}
        </ul>

        {/* UTILITY CONTROL ELEMENT ROW (THEME THEN LANGUAGE SWITCHER AT THE VERY END) */}
        <div className="flex items-center gap-3 border-l border-base-200 pl-4 shrink-0">
          <ThemeSwitcher />

          {/* PREMIUM COMPACT LANGUAGE DROP DOWN WITH GLOBE ICON */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm border border-base-content/20 rounded-xl px-3 flex items-center gap-2 h-9"
            >
              {/* Globe Outline SVG Icon */}
              <svg
                xmlns="http://w3.org"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 opacity-70"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 2.25V21M2.25 12h19.5M12 2.25c2.486 0 4.5 4.365 4.5 9.75s-2.014 9.75-4.5 9.75-4.5-4.365-4.5-9.75 2.014-9.75 4.5-9.75Z"
                />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider">
                {i18n.resolvedLanguage}
              </span>
              <span className="text-[10px] opacity-40">▼</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu menu-sm bg-base-100 rounded-2xl z-50 mt-2 w-32 p-2 shadow-2xl border border-base-200"
            >
              <li>
                <button
                  type="button"
                  onClick={() => changeLanguage("en")}
                  className={`flex items-center gap-2 rounded-xl py-2 ${i18n.resolvedLanguage === "en" ? "active font-bold" : ""}`}
                >
                  <span className="text-sm">🇺🇸</span> English
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => changeLanguage("de")}
                  className={`flex items-center gap-2 rounded-xl py-2 ${i18n.resolvedLanguage === "de" ? "active font-bold" : ""}`}
                >
                  <span className="text-sm">🇩🇪</span> Deutsch
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
