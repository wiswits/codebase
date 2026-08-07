/**
 * Alumni Formatter Utilities
 * Formatting functions for alumni data
 */

export const formatFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`.trim();
};

export const formatBatch = (batch) => {
  return `Batch of ${batch}`;
};

export const formatGraduationYear = (year) => {
  return `Class of ${year}`;
};

export const getStatusLabel = (status) => {
  const labels = {
    active: 'Active',
    inactive: 'Inactive'
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const getFullNameWithTitle = (firstName, lastName, title) => {
  if (title) {
    return `${title} ${firstName} ${lastName}`;
  }
  return formatFullName(firstName, lastName);
};