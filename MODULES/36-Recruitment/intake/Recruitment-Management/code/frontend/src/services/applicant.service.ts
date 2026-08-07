import apiClient from "./api-client";
import {
  Applicant,
  ApplicantFilters,
  ApiResponse,
  PaginatedResponse,
  CreateApplicantRequest,
  UpdateApplicantRequest,
  BulkImportRequest,
  BulkImportResponse,
} from "@/types";
import toast from "react-hot-toast";

export interface PipelineStats {
  [stage: string]: number;
}

export interface ApplicantFilterOptions {
  vacancies: unknown[];
  recruiters: unknown[];
  stages: string[];
  sources: string[];
  statuses: string[];
}

export const applicantService = {
  /**
   * Get Applicants
   */
  async getAll(
    filters?: ApplicantFilters
  ): Promise<PaginatedResponse<Applicant>> {
    const response =
      await apiClient.get<ApiResponse<PaginatedResponse<Applicant>>>(
        "/recruitment/applicants",
        {
          params: filters,
        }
      );

    return response.data.data;
  },

  /**
   * Get Applicant
   */
  async getById(id: number): Promise<Applicant> {
    const response =
      await apiClient.get<ApiResponse<Applicant>>(
        `/recruitment/applicants/${id}`
      );

    return response.data.data;
  },

  /**
   * Create Applicant
   */
  async create(
    data: CreateApplicantRequest
  ): Promise<Applicant> {
    const response =
      await apiClient.post<ApiResponse<Applicant>>(
        "/recruitment/applicants",
        data
      );

    toast.success("Applicant created successfully");

    return response.data.data;
  },

  /**
   * Update Applicant
   */
  async update(
    id: number,
    data: UpdateApplicantRequest
  ): Promise<Applicant> {
    const response =
      await apiClient.put<ApiResponse<Applicant>>(
        `/recruitment/applicants/${id}`,
        data
      );

    toast.success("Applicant updated successfully");

    return response.data.data;
  },

  /**
   * Delete Applicant
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(
      `/recruitment/applicants/${id}`
    );

    toast.success("Applicant deleted successfully");
  },

  /**
   * Change Pipeline Stage
   */
  async changeStage(
    id: number,
    stage: string,
    remarks?: string
  ): Promise<Applicant> {
    const response =
      await apiClient.patch<ApiResponse<Applicant>>(
        `/recruitment/applicants/${id}/stage`,
        {
          stage,
          remarks,
        }
      );

    toast.success(`Stage changed to ${stage}`);

    return response.data.data;
  },

  /**
   * Bulk Import
   */
  async bulkImport(
    data: BulkImportRequest
  ): Promise<BulkImportResponse> {
    const response =
      await apiClient.post<ApiResponse<BulkImportResponse>>(
        "/recruitment/applicants/bulk-import",
        data
      );

    toast.success("Bulk import completed");

    return response.data.data;
  },

  /**
   * Pipeline Statistics
   */
  async getPipelineStats(): Promise<PipelineStats> {
    const response =
      await apiClient.get<ApiResponse<PipelineStats>>(
        "/recruitment/applicants/pipeline/stats"
      );

    return response.data.data;
  },

  /**
   * Filter Options
   */
  async getFilterOptions(): Promise<ApplicantFilterOptions> {
    const response =
      await apiClient.get<ApiResponse<ApplicantFilterOptions>>(
        "/recruitment/applicants/filter-options"
      );

    return response.data.data;
  },

  /**
   * Recent Applicants
   */
  async getRecent(
    limit: number = 10
  ): Promise<Applicant[]> {
    const response =
      await apiClient.get<ApiResponse<Applicant[]>>(
        "/recruitment/applicants/recent",
        {
          params: { limit },
        }
      );

    return response.data.data;
  },

  /**
   * Applicants by Vacancy
   */
  async getByVacancy(
    vacancyId: number
  ): Promise<Applicant[]> {
    const response =
      await apiClient.get<ApiResponse<Applicant[]>>(
        `/recruitment/applicants/by-vacancy/${vacancyId}`
      );

    return response.data.data;
  },

  /**
   * Applicants by Stage
   */
  async getByStage(
    stage: string
  ): Promise<Applicant[]> {
    const response =
      await apiClient.get<ApiResponse<Applicant[]>>(
        `/recruitment/applicants/by-stage/${stage}`
      );

    return response.data.data;
  },

  /**
   * Validate Email
   */
  async validateEmail(
    email: string,
    excludeId?: number
  ): Promise<boolean> {
    const response =
      await apiClient.get<
        ApiResponse<{ isUnique: boolean }>
      >(
        "/recruitment/applicants/validate-email",
        {
          params: {
            email,
            excludeId,
          },
        }
      );

    return response.data.data.isUnique;
  },
};

export default applicantService;