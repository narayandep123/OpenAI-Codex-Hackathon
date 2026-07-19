import AuthForm from "@/components/auth/auth-form";

interface SignInPageProps {
  searchParams?: Promise<{
    redirect?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const redirectTo = params.redirect && params.redirect.startsWith("/") ? params.redirect : "/bookings";

  return <AuthForm mode="sign-in" redirectTo={redirectTo} />;
}