import { describe, it, expect } from 'vitest';
import { PERMISSIONS, hasPermission, hasAnyPermission, hasAllPermissions } from '../../lib/permissions';

describe('Permission Utils', () => {
  const testPermissions = [
    PERMISSIONS.HOSTEL_READ,
    PERMISSIONS.HOSTEL_CREATE,
    PERMISSIONS.ALLOCATION_READ,
  ];

  it('should check if user has a specific permission', () => {
    expect(hasPermission(testPermissions, PERMISSIONS.HOSTEL_READ)).toBe(true);
    expect(hasPermission(testPermissions, PERMISSIONS.HOSTEL_DELETE)).toBe(false);
  });

  it('should check if user has any of the given permissions', () => {
    expect(hasAnyPermission(testPermissions, [
      PERMISSIONS.HOSTEL_DELETE,
      PERMISSIONS.HOSTEL_READ,
    ])).toBe(true);

    expect(hasAnyPermission(testPermissions, [
      PERMISSIONS.HOSTEL_DELETE,
      PERMISSIONS.BED_DELETE,
    ])).toBe(false);
  });

  it('should check if user has all of the given permissions', () => {
    expect(hasAllPermissions(testPermissions, [
      PERMISSIONS.HOSTEL_READ,
      PERMISSIONS.HOSTEL_CREATE,
    ])).toBe(true);

    expect(hasAllPermissions(testPermissions, [
      PERMISSIONS.HOSTEL_READ,
      PERMISSIONS.HOSTEL_DELETE,
    ])).toBe(false);
  });

  it('should validate permission strings', () => {
    expect(PERMISSIONS.HOSTEL_READ).toMatch(/^hms:[a-z_]+:[a-z_]+:[a-z_]+$/);
    expect(PERMISSIONS.ALLOCATION_CREATE).toMatch(/^hms:[a-z_]+:[a-z_]+:[a-z_]+$/);
  });
});