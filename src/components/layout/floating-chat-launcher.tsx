"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import ChatConversation from "@/components/chat/chat-conversation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function FloatingChatLauncher() {
  const pathname = usePathname();
  const [showPulse, setShowPulse] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowPulse(false), 3800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncWithHash = () => {
      setIsOpen(window.location.hash === "#chat-open");
    };

    syncWithHash();
    window.addEventListener("hashchange", syncWithHash);

    return () => window.removeEventListener("hashchange", syncWithHash);
  }, [pathname]);

  const updateChatHash = (open: boolean) => {
    if (open) {
      window.location.hash = "chat-open";
    } else {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", currentUrl);
    }
  };

  const onDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    updateChatHash(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDialogOpenChange}>
      {pathname !== "/chat" ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
          {showPulse ? <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#05aba5]/40 animate-chat-ring" /> : null}
          <button
            type="button"
            onClick={() => updateChatHash(true)}
            className="pointer-events-auto relative inline-flex items-center gap-3 rounded-full border border-cyan-300/80 bg-white/95 px-3 py-2 shadow-lg shadow-cyan-200/40 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
            aria-label="Open SurgiFind chat assistant"
          >
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#05aba5] ring-4 ring-white" />
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg">AI</span>
            <span className="hidden pr-1 text-sm font-semibold text-slate-800 sm:inline">Chat with SurgiFind</span>
          </button>
        </div>
      ) : null}

      <DialogContent className="bottom-4 right-4 left-auto top-auto z-50 flex h-[min(42rem,calc(100vh-2rem))] w-[calc(100vw-2rem)] max-w-md translate-x-0 translate-y-0 flex-col overflow-hidden p-0 sm:bottom-6 sm:right-6 data-[state=open]:animate-[chat-drawer-in_240ms_ease-out] data-[state=closed]:animate-[chat-drawer-out_180ms_ease-in]">
        <DialogHeader className="relative border-b border-slate-200 px-5 py-4 pr-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">SurgiFind Chat</p>
          <DialogTitle className="text-xl">Conversational Surgery Finder</DialogTitle>
          <DialogDescription>Tell us your surgery needs, city, budget, and rating preference.</DialogDescription>
          <button type="button" onClick={() => onDialogOpenChange(false)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close chat">
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <ChatConversation compact storageKey="surgifind-chat-drawer" />
      </DialogContent>
    </Dialog>
  );
}
