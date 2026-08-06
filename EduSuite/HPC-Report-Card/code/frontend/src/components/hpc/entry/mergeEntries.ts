import { Competency, StudentEntry } from '@/lib/types';

export interface MergedCompetencyRow {
  competency: Competency;
  entry: StudentEntry | null;
}

export interface DomainGroup {
  domain_code: string;
  domain_name: string;
  rows: MergedCompetencyRow[];
}

/**
 * The backend only returns entries that already exist (INNER JOIN on
 * client_hpc_entries), so to render "all competencies, filled or not" the
 * frontend must merge the full competency list with whatever entries exist.
 */
export function mergeCompetenciesWithEntries(
  competencies: Competency[],
  entries: StudentEntry[]
): DomainGroup[] {
  const entryByCompetencyId = new Map(entries.map((e) => [e.competency_id, e]));

  const active = competencies.filter((c) => c.is_active);

  const domainMap = new Map<string, DomainGroup>();

  for (const competency of active) {
    const key = competency.domain_code;
    if (!domainMap.has(key)) {
      domainMap.set(key, {
        domain_code: competency.domain_code,
        domain_name: competency.domain_name,
        rows: [],
      });
    }
    domainMap.get(key)!.rows.push({
      competency,
      entry: entryByCompetencyId.get(competency.id) ?? null,
    });
  }

  return Array.from(domainMap.values())
    .map((group) => ({
      ...group,
      rows: group.rows.sort((a, b) => a.competency.display_order - b.competency.display_order),
    }))
    .sort((a, b) => a.domain_name.localeCompare(b.domain_name));
}
