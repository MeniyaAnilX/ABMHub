"use client";

import Link from "next/link";
import { LogOut, Rocket, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type HeaderProps = {
  showAuth?: boolean;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
};

export function Header({ showAuth = false, userEmail, onOpenAuth, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function logout() {
    setMenuOpen(false);
    onLogout?.();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060a13]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[70px] max-w-[1340px] items-center justify-between gap-4 px-6 py-3 max-sm:px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flat-logo grid h-10 w-10 place-items-center rounded-[13px] bg-purple-600">
            <Rocket size={21} />
          </div>
          <div>
            <b className="block text-lg leading-none tracking-tight">ABM Hub</b>
            <span className="block text-[11px] text-slate-400">Airdrop • Trading • Gaming</span>
          </div>
        </Link>

        {showAuth ? (
          userEmail ? (
            <div className="relative" ref={menuRef}>
              <button className="btn btn-ghost" onClick={() => setMenuOpen((value) => !value)}>
                <LogOut size={15} />
                Logout
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[260px] rounded-2xl border border-white/10 bg-[#0b1020] p-3">
                  <div className="mb-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-400">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-600">Signed in as</div>
                    <div className="truncate text-slate-300">{userEmail}</div>
                  </div>

                  <button
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-extrabold text-red-300 hover:bg-red-500/10"
                    onClick={logout}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button className="btn btn-ghost" onClick={onOpenAuth}>
              <User size={15} />
              Sign Up
            </button>
          )
        ) : null}
      </div>
    </header>
  );
}
