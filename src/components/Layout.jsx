import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineSwitchHorizontal,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiMenuAlt2,
  HiX,
} from "react-icons/hi";

const navItems = [
  { to: "/", label: "Overview", icon: HiOutlineHome },
  { to: "/transactions", label: "Transactions", icon: HiOutlineSwitchHorizontal },
  { to: "/debts", label: "Debts", icon: HiOutlineUserGroup },
  { to: "/charts", label: "Analytics", icon: HiOutlineChartBar },
];

function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`${mobile ? "fixed inset-0 z-50 flex" : "hidden lg:flex"}`}>
      {mobile && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      )}

      <div className={`relative z-10 flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 ${mobile ? "shadow-2xl" : ""}`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">₹</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">Fintrack</span>
          </div>
          {mobile && (
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <HiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1" aria-label="Main navigation">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        {user && (
          <div className="px-4 py-4 border-t border-gray-50">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                  {user.name?.charAt(0) || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <HiOutlineLogout className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      {mobileOpen && <Sidebar mobile onClose={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg"
              aria-label="Open menu"
            >
              <HiMenuAlt2 className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">₹</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Fintrack</span>
            </div>
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7" />
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
