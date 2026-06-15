import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1340px] border-t border-white/10 px-6 py-8 text-sm text-slate-400 max-sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-extrabold text-white">ABM Hub</div>
          <p className="mt-1 max-w-xl leading-relaxed">
            ABM Hub helps users discover Web3 airdrop projects, funding details, backers, task information and official project links.
          </p>
        </div>

        <nav className="flex flex-wrap gap-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 font-bold hover:bg-white/[.07] hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        ABM Hub is an informational directory. Airdrops are not guaranteed. Always verify official links and use your own research before connecting a wallet or completing tasks.
      </p>
    </footer>
  );
}
