import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white text-xl sm:text-2xl font-bold">₹</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Fintrack</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Personal Finance Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-center mb-1.5">Welcome</h2>
          <p className="text-xs sm:text-sm text-gray-400 text-center mb-6">
            Sign in to track your finances
          </p>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={login}
              onError={() => console.error("Login failed")}
              shape="pill"
              size="large"
              text="signin_with"
              width="300"
            />
          </div>

          <p className="text-[10px] sm:text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
            Your data is private and isolated per account.
          </p>
        </div>

        <p className="text-[10px] sm:text-[11px] text-gray-400 text-center mt-6">
          Built with ❤️ for personal use
        </p>
      </div>
    </div>
  );
}
