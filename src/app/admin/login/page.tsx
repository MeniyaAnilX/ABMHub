"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/admin");
  }

  return (
    <>
      <Header />
      <main className="app-shell flex min-h-[calc(100vh-90px)] items-center justify-center">
        <form onSubmit={login} className="glass w-full max-w-md rounded-3xl p-6">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight">Admin Login</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-400">
            Only the admin account can add, edit, delete projects and upload logos.
          </p>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-300">
              Email
              <input className="form-field" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Admin email" required />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Password
              <input className="form-field" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </label>

            {message && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{message}</div>}

            <button className="btn w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
