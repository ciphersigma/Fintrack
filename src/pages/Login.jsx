import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex flex-col">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg shadow-black/10">
          <span className="text-white text-3xl font-bold">₹</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Fintrack</h1>
        <p className="text-white/50 text-sm mt-1.5">Your money, your control</p>

        <div className="mt-10 mb-10 space-y-2.5 w-full max-w-xs">
          {["Track income & expenses", "Manage debts & EMIs", "Visual spending analytics", "Private & secure per account"].map((t) => (
            <div key={t} className="flex items-center gap-3 text-white/70">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              <span className="text-sm">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom card */}
      <div className="relative bg-white rounded-t-3xl px-6 pt-8 pb-10" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 40px)" }}>
        <p className="text-lg font-bold text-gray-900 text-center mb-1">Get Started</p>
        <p className="text-sm text-gray-400 text-center mb-6">Sign in to continue</p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={login}
            onError={() => console.error("Login failed")}
            shape="pill"
            size="large"
            text="continue_with"
            width="320"
          />
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
          Your data is stored securely and isolated per account.
        </p>
      </div>
    </div>
  );
}
