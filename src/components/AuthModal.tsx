"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";
type MessageType = "info" | "error" | "already" | "invalid";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abmhub.xyz").replace(/\/$/, "");

function parseAuthError(message: string, mode: AuthMode) {
  const lower = message.toLowerCase();

  if (lower.includes("email rate limit") || lower.includes("rate limit")) {
    return {
      type: "error" as MessageType,
      text: "Email limit reached. Try again later.",
    };
  }

  if (lower.includes("user already registered") || lower.includes("already registered") || lower.includes("already exists")) {
    return {
      type: "already" as MessageType,
      text: "Email already registered. Please login with your password.",
    };
  }

  if (lower.includes("invalid login credentials")) {
    return {
      type: "invalid" as MessageType,
      text: mode === "login" ? "Email or password incorrect." : "Signup failed. Please check your details.",
    };
  }

  if (lower.includes("email not confirmed")) {
    return {
      type: "error" as MessageType,
      text: "Email not confirmed yet. Please open your confirmation email first, then login.",
    };
  }

  return {
    type: "error" as MessageType,
    text: message,
  };
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: MessageType; text: string } | null>(null);
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

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      setBusy(false);

      if (error) {
        setMessage(parseAuthError(error.message, "login"));
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
      const parsed = parseAuthError(error.message, "signup");
      setMessage(parsed);

      if (parsed.type === "already") {
        setMode("login");
      }

      return;
    }

    if (!data.session) {
      setMessage({
        type: "info",
        text: "Account created. Please check your email to confirm, then login.",
      });
      setMode("login");
      return;
    }

    setEmail("");
    setPassword("");
    onSuccess?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/70 p-4 max-sm:items-end max-sm:p-0">
      <button className="absolute inset-0 cursor-default" aria-label="Close auth popup" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative z-[91] w-full max-w-md rounded-[24px] border border-white/15 bg-[#0b1220] p-6 max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-[24px] max-sm:p-5"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight max-sm:text-xl">
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
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`rounded-xl px-3 py-2 text-sm font-extrabold ${mode === "signup" ? "bg-white/10 text-white" : "text-slate-400"}`}
            onClick={() => switchMode("signup")}
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
            <div
              className={`rounded-xl border p-3 text-sm ${
                message.type === "already"
                  ? "border-amber-500/25 bg-amber-500/10 text-amber-100"
                  : message.type === "invalid" || message.type === "error"
                    ? "border-red-500/25 bg-red-500/10 text-red-100"
                    : "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <button className="btn w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
