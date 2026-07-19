import AuthForm from "@/components/auth/auth-form";

interface SignUpPageProps {
  searchParams?: Promise<{
    redirect?: string;
  }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};
  const redirectTo = params.redirect && params.redirect.startsWith("/") ? params.redirect : "/bookings";

  return <AuthForm mode="sign-up" redirectTo={redirectTo} />;
}