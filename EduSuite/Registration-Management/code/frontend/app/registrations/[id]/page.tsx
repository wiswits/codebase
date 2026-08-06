import { RegistrationDetail } from "@/modules/registration/components/detail/RegistrationDetail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RegistrationPage({
  params,
}: PageProps) {
  const { id } = await params;

  const registrationId = Number(id);

  return (
    <RegistrationDetail
      registrationId={registrationId}
    />
  );
}