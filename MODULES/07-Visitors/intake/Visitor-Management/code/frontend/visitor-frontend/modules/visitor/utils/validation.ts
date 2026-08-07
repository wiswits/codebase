export interface VisitorFormValues {
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorType?: string;

  purpose: string;

  hostId: number | string;
  hostName?: string;
}

export interface VisitorValidationErrors {
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorType?: string;
  purpose?: string;
  hostId?: string;
  hostName?: string;
}

export function isValidEmail(
  email: string
): boolean {
  const value = email.trim();

  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

export function isValidPhone(
  phone: string
): boolean {
  const value = phone.trim();

  if (!value) {
    return true;
  }

  return /^[0-9+\-\s()]{7,20}$/.test(value);
}

export function validateVisitorForm(
  values: VisitorFormValues
): VisitorValidationErrors {
  const errors: VisitorValidationErrors = {};

  if (!values.visitorName.trim()) {
    errors.visitorName =
      "Visitor name is required.";
  }

  if (
    values.visitorPhone &&
    !isValidPhone(values.visitorPhone)
  ) {
    errors.visitorPhone =
      "Enter a valid phone number.";
  }

  if (
    values.visitorEmail &&
    !isValidEmail(values.visitorEmail)
  ) {
    errors.visitorEmail =
      "Enter a valid email address.";
  }

  if (!values.purpose.trim()) {
    errors.purpose =
      "Purpose of visit is required.";
  }

  const hostId = Number(values.hostId);

  if (
    !Number.isInteger(hostId) ||
    hostId <= 0
  ) {
    errors.hostId =
      "A valid host ID is required.";
  }

  return errors;
}

export function hasValidationErrors(
  errors: VisitorValidationErrors
): boolean {
  return Object.keys(errors).length > 0;
}