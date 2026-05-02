import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import QuickAdd from "./QuickAdd";
import PullToRefresh from "./PullToRefresh";
import {
  HiOutlineHome,
  HiOutlineSwitchHorizontal,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineUserCircle,
  HiHome,
  HiSwitchHorizontal,
  HiUserGroup,
  HiChartBar,
  HiUserCircle,
} from "react-icons/hi";

const navItems = [
  { to: "/", label: "Home", icon: HiOutlineHome, iconActive: HiHome },
  { to: "/transactions", label: "Transactions", icon: HiOutlineSwitchHorizontal, iconActive: HiSwitchHorizontal },
  { to: "/debts", label: "Debts", icon: HiOutlineUserGroup, iconActive: HiUserGroup },
  { to: "/charts", label: "Analytics", icon: HiOutlineChartBar, iconActive: HiChartBar },
];

const mobileNavItems = [
  ...navItems,
  { to: "/account", label: "Account", icon: HiOutlineUserCircle, iconActive: HiUserCircle },
];

// ── Desktop Sidebar ──
function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex">
      <div className="flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0">
        <div className="flex items-center h-16 px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">₹</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">Fintrack</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1" aria-label="Main navigation">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
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

          <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Settings</p>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`
            }
          >
            <HiOutlineUserCircle className="w-[18px] h-[18px]" />
            Account
          </NavLink>
        </nav>

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

// ── Mobile Bottom Tab Bar ──
function BottomTabs() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch">
        {mobileNavItems.map(({ to, label, icon: IconOutline, iconActive: IconFilled }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-400"
              }`
            }
          >
            {({ isActive }) => {
              const Icon = isActive ? IconFilled : IconOutline;
              return (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium mt-0.5">{label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Layout() {
  const { refreshAll } = useFinance();

  return (
    <div className="min-h-screen flex">
      {/* Desktop: sidebar */}
      <Sidebar />

      <PullToRefresh onRefresh={refreshAll}>
        {/* Mobile: minimal top bar with just the logo */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-center h-12">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">₹</span>
              </div>
              <span className="text-sm font-bold text-gray-900">Fintrack</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-4 lg:py-8 pb-24 lg:pb-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile: bottom tab bar */}
        <BottomTabs />

        {/* Quick add floating button */}
        <QuickAdd />
      </PullToRefresh>
    </div>
  );
}
