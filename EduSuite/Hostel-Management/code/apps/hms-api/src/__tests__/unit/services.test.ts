import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HostelService } from '../../services/hostelService';
import { AllocationService } from '../../services/allocationService';
import { AttendanceService } from '../../services/attendanceService';

describe('Services Unit Tests', () => {
  const mockOrgId = 'org-1';
  const mockUserId = 'user-1';

  describe('HostelService', () => {
    it('should create a hostel', async () => {
      const data = {
        campusId: 'campus-1',
        code: 'TEST-01',
        name: 'Test Hostel',
        type: 'boys' as const,
        rules: {},
        facilities: ['WiFi'],
        isActive: true,
      };

      const result = await HostelService.create(mockOrgId, data);
      expect(result).toBeDefined();
      expect(result.org_id).toBe(mockOrgId);
      expect(result.code).toBe('TEST-01');
    });

    it('should get hostel by id', async () => {
      const hostel = await HostelService.findById('test-id', mockOrgId);
      expect(hostel).toBeDefined();
    });

    it('should update hostel', async () => {
      const data = {
        name: 'Updated Hostel',
        isActive: false,
      };

      const result = await HostelService.update('test-id', mockOrgId, data);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Hostel');
      expect(result?.is_active).toBe(false);
    });
  });

  describe('AllocationService', () => {
    it('should create an allocation', async () => {
      const data = {
        apexStudentId: 'student-1',
        bedId: 'bed-1',
        effectiveFrom: new Date().toISOString(),
      };

      const result = await AllocationService.create(mockOrgId, mockUserId, data);
      expect(result).toBeDefined();
      expect(result.allocation).toBeDefined();
      expect(result.bed).toBeDefined();
    });

    it('should prevent duplicate allocation', async () => {
      const data = {
        apexStudentId: 'student-1',
        bedId: 'bed-1',
        effectiveFrom: new Date().toISOString(),
      };

      await expect(AllocationService.create(mockOrgId, mockUserId, data))
        .rejects
        .toThrow('BED_ALREADY_ALLOCATED');
    });

    it('should vacate an allocation', async () => {
      const data = {
        reason: 'Student graduated',
        damageCharges: 0,
      };

      const result = await AllocationService.vacate(mockOrgId, mockUserId, 'alloc-1', data);
      expect(result).toBeDefined();
      expect(result.vacated_at).toBeDefined();
      expect(result.vacate_reason).toBe('Student graduated');
    });
  });

  describe('AttendanceService', () => {
    it('should mark bulk attendance', async () => {
      const data = {
        hostelId: 'hostel-1',
        date: new Date(),
        records: [
          { studentId: 'student-1', status: 'present' as const },
          { studentId: 'student-2', status: 'absent' as const },
        ],
      };

      const result = await AttendanceService.bulkMarkAttendance(mockOrgId, mockUserId, data);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle upsert for existing attendance', async () => {
      const data = {
        hostelId: 'hostel-1',
        date: new Date(),
        records: [
          { studentId: 'student-1', status: 'present' as const },
        ],
      };

      const result = await AttendanceService.bulkMarkAttendance(mockOrgId, mockUserId, data);
      expect(result.results).toHaveLength(1);
    });

    it('should get attendance roster', async () => {
      const roster = await AttendanceService.getAttendanceRoster(
        mockOrgId,
        'hostel-1',
        new Date()
      );
      expect(Array.isArray(roster)).toBe(true);
    });
  });
});