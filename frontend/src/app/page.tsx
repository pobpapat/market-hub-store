"use client";

import { useCallback, useEffect, useState } from "react";

// ✅ ย้าย API_URL ออกมาข้างนอก component เพื่อให้ useCallback deps array ไม่ต้อง include ค่านี้
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  id: number;
  email: string;
  name?: string;
  createdAt: string;
}

export default function Home() {
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ✅ useCallback เพื่อให้ function reference stable → useEffect deps ถูกต้อง
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      if (!res.ok) throw new Error("Server returned error status");
      const data = await res.json();
      setHealth(data);
      setHealthError(null);
    } catch (err: unknown) {
      // ✅ ใช้ unknown แทน any + type narrowing ด้วย instanceof
      setHealth(null);
      setHealthError(err instanceof Error ? err.message : "Failed to reach server");
    }
  }, []);

  // ✅ useCallback เพื่อให้ function reference stable
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
      setUsersError(null);
    } catch (err: unknown) {
      // ✅ ใช้ unknown แทน any + type narrowing ด้วย instanceof
      setUsersError(err instanceof Error ? err.message : "Failed to fetch users");
    }
  }, []);

  // ✅ เพิ่ม fetchHealth, fetchUsers ใน deps array
  useEffect(() => {
    fetchHealth();
    fetchUsers();
    // Poll health status every 10 seconds
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      setEmail("");
      setName("");
      setSubmitSuccess(true);
      fetchUsers();
    } catch (err: unknown) {
      // ✅ ใช้ unknown แทน any + type narrowing ด้วย instanceof
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-6 md:p-12 relative overflow-hidden">
      {/* Dynamic colorful blur backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10 flex flex-col gap-8">
        {/* Header section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Next.js + Express + PostgreSQL Setup
            </p>
          </div>

          {/* Health Status Indicator */}
          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur border border-slate-800 px-4 py-2 rounded-full shadow-inner">
            <span className="text-xs text-slate-400 font-medium">Server API Status:</span>
            {health ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-400">Online</span>
              </div>
            ) : healthError ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-xs font-semibold text-rose-400">Offline</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">Checking...</span>
            )}
          </div>
        </header>

        {/* Content body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Registration Form Card */}
          <section className="md:col-span-1 bg-slate-900/40 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              Register User
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition shadow-lg shadow-violet-600/20 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Add User"}
              </button>

              {submitSuccess && (
                <p className="text-xs text-emerald-400 text-center mt-2">
                  ✓ User registered successfully!
                </p>
              )}
            </form>
          </section>

          {/* Database Users List Card */}
          <section className="md:col-span-2 bg-slate-900/40 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                Registered Users
              </h2>
              <button
                onClick={fetchUsers}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.27 15" />
                </svg>
                Refresh
              </button>
            </div>

            {usersError ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-950/20 border border-rose-900/30 rounded-xl">
                <p className="text-sm font-semibold text-rose-400">Failed to fetch database users</p>
                <p className="text-xs text-rose-500 mt-1">{usersError}</p>
                <p className="text-xs text-slate-500 mt-4 max-w-sm">
                  Make sure your backend server is running and PostgreSQL migrations are successfully applied.
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-950/40 border border-slate-800/40 rounded-xl">
                <p className="text-sm text-slate-500 font-medium">No users found in database.</p>
                <p className="text-xs text-slate-600 mt-1">Add a new user using the registration card.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900/60">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/20 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">#{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">{user.name || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Informational Footer */}
        <footer className="text-center text-xs text-slate-600 border-t border-slate-900/60 pt-6">
          Next.js Client running on port 3000 • Express API running on port 5000
        </footer>
      </div>
    </main>
  );
}