import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import FloatingChatLauncher from "@/components/layout/floating-chat-launcher";
import SiteFooter from "@/components/layout/site-footer";
import SiteNav from "@/components/layout/site-nav";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/lib/supabase/useAuth";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SurgiFind — Find the Right Hospital for Your Surgery",
  description:
    "Compare hospitals by surgery, price, rating, insurance coverage, and availability across India.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialUser={user}>
          <SiteNav />
          {children}
          <FloatingChatLauncher />
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
