"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(""); 
    router.push("/"); // Redirect to homepage
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

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-[#0a1a2f] mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3BAFDA]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[#0a1a2f] mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[#EAEAEA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3BAFDA]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-[#1f4e79] hover:bg-[#2d6da3] text-white font-semibold transition-colors duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
