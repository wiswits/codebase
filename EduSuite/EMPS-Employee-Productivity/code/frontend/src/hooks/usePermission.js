import { usePermission as usePermissionContext } from '../contexts/PermissionContext';

export const usePermission = () => {
  return usePermissionContext();
};