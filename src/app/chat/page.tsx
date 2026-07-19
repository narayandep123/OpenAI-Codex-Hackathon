"use client";

import Link from "next/link";
import ChatConversation from "@/components/chat/chat-conversation";

export default function ChatPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-white/90 px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">SurgiFind Chat</p>
          <h1 className="text-xl font-semibold text-slate-900">Conversational Surgery Finder</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/insurance"
            className="rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            Insurance
          </Link>
          <Link
            href="/search"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open Filters
          </Link>
        </div>
      </header>

      <section className="flex min-h-[60vh] flex-1 flex-col rounded-3xl border border-slate-200 bg-white/85 shadow-lg backdrop-blur">
        <ChatConversation />
      </section>
    </main>
  );
}
