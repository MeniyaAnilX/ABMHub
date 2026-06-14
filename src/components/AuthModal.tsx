"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abmhub.xyz").replace(/\/$/, "");

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const cleanEmail = email.trim();

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: SITE_URL,
            },
          })
        : await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Please check your email to confirm, then login.");
      return;
    }

    setEmail("");
    setPassword("");
    onSuccess?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4">
      <button className="absolute inset-0 cursor-default" aria-label="Close auth popup" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative z-[91] w-full max-w-md rounded-[24px] border border-white/15 bg-[#0b1220] p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {mode === "signup" ? "Create Account" : "Login"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Save favorite projects and access your watchlist.
            </p>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-400 hover:text-white"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm text-slate-300">
            Email
            <input
              className="form-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Password
            <input
              className="form-field"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>

          {message ? (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              {message}
            </div>
          ) : null}

          <button className="btn w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "signup" ? "Sign Up" : "Login"}
          </button>

          <button
            type="button"
            className="text-sm font-bold text-blue-300 hover:underline"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
          >
            {mode === "signup" ? "Already have account? Login" : "New user? Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
