import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 text-sm text-slate-600 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-lg font-semibold tracking-wide text-slate-900">SurgiFind</p>
          <p>Find hospitals, compare surgery costs, and explore insurance coverage in one place.</p>
          <p className="text-xs text-slate-500">
            <Link href="/about" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
              Built by Team SurgiFind
            </Link>
          </p>
          <p className="text-xs">Mock demo for hackathon use only. No real medical or insurance transactions are processed.</p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-slate-700">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-rose-700"><Heart className="h-3.5 w-3.5 fill-current" /> Made with care for the hackathon</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-800"><Sparkles className="h-3.5 w-3.5" /> Built for better care choices</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-semibold text-slate-900">Quick Links</p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <Link href="/search" className="hover:text-slate-900">Search</Link>
            <Link href="/chat" className="hover:text-slate-900">Chat</Link>
            <Link href="/insurance" className="hover:text-slate-900">Insurance</Link>
            <Link href="/about" className="hover:text-slate-900">About</Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-semibold text-slate-900">Support</p>
          <p>Contact / 24x7 Support</p>
          <p className="font-semibold text-slate-900">+918757299533</p>
        </div>
      </div>
    </footer>
  );
}
