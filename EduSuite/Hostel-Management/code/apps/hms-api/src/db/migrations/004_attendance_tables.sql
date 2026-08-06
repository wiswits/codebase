-- Attendance table
CREATE TABLE hms.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    hostel_id UUID NOT NULL REFERENCES hms.hostel(id) ON DELETE CASCADE,
    apex_student_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'on_leave', 'late')),
    method TEXT NOT NULL CHECK (method IN ('manual', 'qr')),
    marked_by UUID NOT NULL,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    device_id TEXT,
    UNIQUE (apex_student_id, attendance_date)
);

CREATE INDEX idx_attendance_org_id ON hms.attendance(org_id);
CREATE INDEX idx_attendance_hostel_id ON hms.attendance(hostel_id);
CREATE INDEX idx_attendance_student_id ON hms.attendance(apex_student_id);
CREATE INDEX idx_attendance_date ON hms.attendance(attendance_date);
CREATE INDEX idx_attendance_status ON hms.attendance(status);
CREATE INDEX idx_attendance_method ON hms.attendance(method);
CREATE INDEX idx_attendance_marked_at ON hms.attendance(marked_at);

-- Composite indexes for common queries
CREATE INDEX idx_attendance_hostel_date ON hms.attendance(hostel_id, attendance_date);
CREATE INDEX idx_attendance_student_date ON hms.attendance(apex_student_id, attendance_date);

COMMENT ON TABLE hms.attendance IS 'Daily attendance records for students';