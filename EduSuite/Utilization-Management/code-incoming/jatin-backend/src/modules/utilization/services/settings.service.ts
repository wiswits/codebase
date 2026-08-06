import { AuthenticatedUser, ModuleSettings, UpdateSettingsInput } from '../types';

import { settingsRepository } from '../repositories/settings.repository';
import { auditService } from '../../../core/audit/audit.service';

const DEFAULT_SETTINGS: Omit<ModuleSettings, 'org_id' | 'updated_at'> = {
  default_capacity_hours: 40,
  utilization_target_percentage: 75,
  bench_alert_threshold_days: 14,
};

class SettingsService {
  async get(user: AuthenticatedUser): Promise<ModuleSettings> {
    const existing = await settingsRepository.findByOrg(user.org_id);

    if (existing) {
      return existing;
    }

    return {
      org_id: user.org_id,
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }

  async update(user: AuthenticatedUser, input: UpdateSettingsInput): Promise<ModuleSettings> {
    const updated = await settingsRepository.upsert(user.org_id, input);

    await auditService.record({
      org_id: user.org_id,
      actor_id: user.id,
      action: 'UPDATE',
      resource: 'MODULE_SETTINGS',
      resource_id: user.org_id,
      metadata: { changes: input },
    });

    return updated;
  }
}

export const settingsService = new SettingsService();
