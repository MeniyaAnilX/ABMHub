"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abmhub.xyz").replace(/\/$/, "");

function authMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("email rate limit") || lower.includes("rate limit")) {
    return "Email limit reached. If you already have an account, use Login. New signup emails may need custom SMTP or waiting before retry.";
  }

  if (lower.includes("user already registered") || lower.includes("already registered") || lower.includes("already exists")) {
    return "This email already has an account. Please use Login.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Wrong email or password. If you are new, create account first. If you already signed up, confirm your email then login.";
  }

  if (lower.includes("email not confirmed")) {
    return "Email not confirmed yet. Please open your confirmation email first, then login.";
  }

  return message;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        onSuccess?.();
        onClose();
      }
    });
  }, [open, onClose, onSuccess]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      setBusy(false);

      if (error) {
        setMessage(authMessage(error.message));
        return;
      }

      setEmail("");
      setPassword("");
      onSuccess?.();
      onClose();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: SITE_URL,
      },
    });

    setBusy(false);

    if (error) {
      const friendlyMessage = authMessage(error.message);
      setMessage(friendlyMessage);

      if (friendlyMessage.includes("already has an account")) {
        setMode("login");
      }

      return;
    }

    if (!data.session) {
      setMessage("Signup request received. If this is a new email, check your inbox to confirm. If this email already has an account, use Login.");
      setMode("login");
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

        <div className="mb-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-sm font-extrabold ${mode === "login" ? "bg-white/10 text-white" : "text-slate-400"}`}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-sm font-extrabold ${mode === "signup" ? "bg-white/10 text-white" : "text-slate-400"}`}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Sign Up
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
              autoComplete="email"
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
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
            {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </button>

          <p className="text-center text-xs leading-relaxed text-slate-500">
            Existing users should use Login. Signup sends a confirmation email only for new accounts.
          </p>
        </div>
      </form>
    </div>
  );
}
