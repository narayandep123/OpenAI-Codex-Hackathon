import { redirect } from "next/navigation";

interface LegacyDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyHospitalRoute({ params }: LegacyDetailsPageProps) {
  const { id } = await params;
  redirect(`/hospital/${id}`);
}
