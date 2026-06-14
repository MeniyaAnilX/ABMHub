import Link from "next/link";
import { Rocket } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060a13]">
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
      </div>
    </header>
  );
}
