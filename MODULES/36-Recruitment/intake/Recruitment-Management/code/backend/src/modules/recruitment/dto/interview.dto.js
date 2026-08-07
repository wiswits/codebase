/**
 * Interview DTO (Data Transfer Object)
 * Used for API responses
 */

export class InterviewDTO {
  constructor(interview) {
    this.id = interview.id;
    this.applicantId = interview.applicant_id;
    this.vacancyId = interview.vacancy_id;
    this.interviewRound = interview.interview_round;
    this.interviewType = interview.interview_type;
    this.interviewMode = interview.interview_mode;
    this.interviewDate = interview.interview_date;
    this.startTime = interview.start_time;
    this.endTime = interview.end_time;
    this.venue = interview.venue;
    this.meetingLink = interview.meeting_link;
    this.interviewerName = interview.interviewer_name;
    this.interviewerEmail = interview.interviewer_email;
    this.interviewerDesignation = interview.interviewer_designation;
    this.rating = interview.rating;
    this.feedback = interview.feedback;
    this.recommendation = interview.recommendation;
    this.status = interview.status;
    this.remarks = interview.remarks;
    this.applicantName = interview.applicant_name;
    this.applicantEmail = interview.applicant_email;
    this.applicantPhone = interview.applicant_phone;
    this.jobTitle = interview.job_title;
    this.vacancyCode = interview.vacancy_code;
    this.department = interview.department;
    this.createdBy = interview.created_by;
    this.updatedBy = interview.updated_by;
    this.createdAt = interview.created_at;
    this.updatedAt = interview.updated_at;
  }

  static fromEntity(interview) {
    if (!interview) return null;
    return new InterviewDTO(interview);
  }

  static fromEntities(interviews) {
    if (!interviews || !Array.isArray(interviews)) return [];
    return interviews.map(i => new InterviewDTO(i));
  }
}

/**
 * Create Interview Request DTO
 */
export class CreateInterviewRequestDTO {
  constructor(data) {
    this.applicant_id = data.applicantId || data.applicant_id;
    this.vacancy_id = data.vacancyId || data.vacancy_id;
    this.interview_round = data.interviewRound || data.interview_round || 1;
    this.interview_type = data.interviewType || data.interview_type;
    this.interview_mode = data.interviewMode || data.interview_mode;
    this.interview_date = data.interviewDate || data.interview_date;
    this.start_time = data.startTime || data.start_time;
    this.end_time = data.endTime || data.end_time;
    this.venue = data.venue;
    this.meeting_link = data.meetingLink || data.meeting_link;
    this.interviewer_name = data.interviewerName || data.interviewer_name;
    this.interviewer_email = data.interviewerEmail || data.interviewer_email;
    this.interviewer_designation = data.interviewerDesignation || data.interviewer_designation;
    this.status = data.status;
    this.remarks = data.remarks;
  }
}

/**
 * Update Interview Status Request DTO
 */
export class UpdateInterviewStatusDTO {
  constructor(data) {
    this.status = data.status;
    this.feedback = data.feedback;
    this.rating = data.rating;
    this.recommendation = data.recommendation;
    this.remarks = data.remarks;
  }
}

export default InterviewDTO;