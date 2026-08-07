import { GoalDetail } from "@/modules/pms/components/goals/GoalDetail";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GoalDetail goalId={id} />;
}
