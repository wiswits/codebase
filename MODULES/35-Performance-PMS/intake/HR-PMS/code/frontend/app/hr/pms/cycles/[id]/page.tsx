import { CycleDetail } from "@/modules/pms/components/cycles/CycleDetail";

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CycleDetail cycleId={id} />;
}
