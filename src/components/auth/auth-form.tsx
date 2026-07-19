"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  mode: AuthMode;
  redirectTo: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid credentials. Please check your email and password.";
  }

  if (normalized.includes("user already registered")) {
    return "Email already registered. Please sign in instead.";
  }

  if (normalized.includes("password should be at least")) {
    return "Password must be at least 6 characters.";
  }

  return message;
}

export default function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === "sign-in";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignIn) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.replace(redirectTo);
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      setSuccess("Account created. Check your email to verify your account, then sign in.");
    } catch (submissionError) {
      setError(
        getErrorMessage(
          submissionError instanceof Error ? submissionError.message : "Authentication failed.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-8">
      <Card className="w-full rounded-3xl border-slate-200 bg-white/95 shadow-xl">
        <CardHeader className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">SurgiFind Access</p>
          <CardTitle className="text-3xl text-slate-900">
            {isSignIn ? "Sign in to continue" : "Create your account"}
          </CardTitle>
          <p className="text-sm text-slate-600">
            {isSignIn
              ? "Sign in to confirm bookings and view your saved reservations."
              : "Create an account to book consultations and surgeries with persistent history."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-cyan-300 transition focus:ring"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                className="rounded-xl border border-slate-300 px-3 py-2.5 outline-none ring-cyan-300 transition focus:ring"
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
            ) : null}

            <Button type="submit" className="w-full bg-[#05aba5] text-white hover:bg-[#04938e]" disabled={isSubmitting}>
              {isSubmitting ? (isSignIn ? "Signing in..." : "Creating account...") : (isSignIn ? "Sign In" : "Sign Up")}
            </Button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <Link
              href={`${isSignIn ? "/sign-up" : "/sign-in"}?redirect=${encodeURIComponent(redirectTo)}`}
              className="font-semibold text-teal-700 underline-offset-4 hover:underline"
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}