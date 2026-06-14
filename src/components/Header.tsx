"use client";

import Link from "next/link";
import { LogOut, Rocket, User } from "lucide-react";

type HeaderProps = {
  showAuth?: boolean;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
};

export function Header({ showAuth = false, userEmail, onOpenAuth, onLogout }: HeaderProps) {
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
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[180px] truncate text-xs font-bold text-slate-400 sm:inline">
                {userEmail}
              </span>
              <button className="btn btn-ghost" onClick={onLogout}>
                <LogOut size={15} />
                Logout
              </button>
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
