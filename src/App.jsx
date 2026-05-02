import { Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Debts from "./pages/Debts";
import Charts from "./pages/Charts";
import Login from "./pages/Login";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Error boundary to prevent white screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] px-6">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl"
            >
              Clear data & reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <FinanceProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/charts" element={<Charts />} />
        </Route>
      </Routes>
    </FinanceProvider>
  );
}

export default function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] px-6">
        <div className="text-center max-w-sm">
          <p className="text-lg font-bold text-gray-900 mb-2">Configuration Missing</p>
          <p className="text-sm text-gray-500">VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
