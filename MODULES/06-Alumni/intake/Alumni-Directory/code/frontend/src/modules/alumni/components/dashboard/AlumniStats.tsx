import {
  GraduationCap,
  UserCheck,
  UserMinus,
  Users
} from "lucide-react";

import StatCard from "./StatCard";

import type {
  AlumniStats as AlumniStatsType
} from "../../types/alumni.types";

interface AlumniStatsProps {
  stats: AlumniStatsType;
}

export default function AlumniStats({
  stats
}: AlumniStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Alumni"
        value={stats.total}
        description="Registered alumni records"
        icon={Users}
      />

      <StatCard
        title="Active Alumni"
        value={stats.active}
        description="Currently active profiles"
        icon={UserCheck}
      />

      <StatCard
        title="Inactive Alumni"
        value={stats.inactive}
        description="Inactive profiles"
        icon={UserMinus}
      />

      <StatCard
        title="Batches"
        value={stats.byBatch.length}
        description="Represented alumni batches"
        icon={GraduationCap}
      />
    </section>
  );
}