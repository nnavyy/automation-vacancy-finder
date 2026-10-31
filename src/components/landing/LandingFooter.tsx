import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
export default function LandingFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-white/10 px-5 py-10 text-sm text-zinc-500 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
        <div><Link href="/" className="flex items-center gap-3 font-medium text-zinc-200"><BrandLogo size={25} />HH Job Copilot</Link><p className="mt-3 text-xs">A clearer view of your next opportunity.</p></div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-7 gap-y-4">
          <Link href="/#pricing" className="hover:text-white">Pricing</Link><Link href="/about" className="hover:text-white">About</Link><a href="mailto:nandazhafran@gmail.com" className="hover:text-white">Contact</a><Link href="/legal/privacy" className="hover:text-white">Privacy</Link><Link href="/legal/terms" className="hover:text-white">Terms</Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-white/[0.06] pt-6 text-xs">© {new Date().getFullYear()} HH Job Copilot. Independent of HeadHunter and Telegram.</p>
    </footer>
  );
}
