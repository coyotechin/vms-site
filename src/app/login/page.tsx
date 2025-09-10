"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * DEMO ACCOUNTS
 * Replace with a real server-side auth in production.
 */
const DEMO_ACCOUNTS: Record<
  string,
  { password: string; role: "admin" | "user"; redirect: string }
> = {
  "admin@vms.com": { password: "admin123", role: "admin", redirect: "/admin/hero" },
  "user@vms.com": { password: "user123", role: "user", redirect: "/" },
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already "logged in" (demo), send to the right place
  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("role");
    if (role === "admin") router.replace("/admin/hero");
    if (role === "user") router.replace("/");
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const eLower = email.trim().toLowerCase();
    if (!eLower || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);

    const account = DEMO_ACCOUNTS[eLower];
    if (!account || account.password !== password) {
      setError("Invalid email or password.");
      setSubmitting(false);
      return;
    }

    // Store minimal session info (demo only)
    localStorage.setItem("role", account.role);
    localStorage.setItem("email", eLower);

    router.push(account.redirect);
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Logo */}
      <div className="w-1/2 flex items-center justify-center bg-gradient-to-br from-[#0a1a2f] to-[#13294b]">
        <img src="/logo.png" alt="Company Logo" className="max-w-xs" />
      </div>

      {/* Right side - Login form */}
      <div className="w-1/2 flex items-center justify-center bg-[#F5F5F5]">
        <div className="w-3/4 max-w-md p-10 bg-white rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold text-[#13294b] mb-6">Login</h2>

          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4 text-sm">
              {error}
            </p>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-[#0a1a2f] mb-2 font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3BAFDA]"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[#0a1a2f] mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3BAFDA] pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[#2d6da3] hover:underline px-2 py-1"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 rounded-lg bg-[#1f4e79] hover:bg-[#2d6da3] text-white font-semibold transition-colors duration-200 disabled:opacity-60"
            >
              {submitting ? "Checking…" : "Login"}
            </button>
          </form>

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <div>
              Admin demo: <span className="font-mono">admin@vms.com</span> /{" "}
              <span className="font-mono">admin123</span>
            </div>
            <div>
              User demo: <span className="font-mono">user@vms.com</span> /{" "}
              <span className="font-mono">user123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
