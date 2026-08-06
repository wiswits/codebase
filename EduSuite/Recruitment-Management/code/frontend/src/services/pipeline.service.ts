import apiClient from "./api-client";
import {
  Applicant,
  ApiResponse,
  PaginatedResponse,
  Stage,
} from "@/types";

export interface PipelineStageStats {
  [stage: string]: number;
}

export interface StageStatistics {
  total: number;
  byStage: Record<string, number>;
}

export interface StageDuration {
  stage: string;
  averageDays: number;
}

export interface TransitionFlow {
  fromStage: string;
  toStage: string;
  count: number;
}

export const pipelineService = {
  /**
   * Get pipeline statistics
   */
  async getStats(): Promise<PipelineStageStats> {
    const response = await apiClient.get<ApiResponse<PipelineStageStats>>(
      "/recruitment/applicants/pipeline/stats"
    );

    return response.data.data;
  },

  /**
   * Get all applicants grouped by stage
   */
  async getAll(): Promise<Record<string, Applicant[]>> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Applicant>>
    >("/recruitment/applicants", {
      params: {
        limit: 500,
      },
    });

    const applicants = response.data.data.items;

    const grouped: Record<string, Applicant[]> = {};

    applicants.forEach((applicant) => {
      const stage = applicant.currentStage || "Applied";

      if (!grouped[stage]) {
        grouped[stage] = [];
      }

      grouped[stage].push(applicant);
    });

    return grouped;
  },

  /**
   * Get applicants by stage
   */
  async getByStage(stage: string): Promise<Applicant[]> {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Applicant>>
    >(`/recruitment/applicants/by-stage/${stage}`);

    return response.data.data.items;
  },

  /**
   * Move applicant to another stage
   */
  async moveToStage(
    id: number,
    stage: string,
    remarks?: string
  ): Promise<Applicant> {
    const response = await apiClient.patch<ApiResponse<Applicant>>(
      `/recruitment/applicants/${id}/stage`,
      {
        stage,
        remarks,
      }
    );

    return response.data.data;
  },

  /**
   * Stage History
   */
  async getHistory(applicantId: number): Promise<Stage[]> {
    const response = await apiClient.get<ApiResponse<Stage[]>>(
      `/recruitment/stages/applicant/${applicantId}/history`
    );

    return response.data.data;
  },

  /**
   * Stage Statistics
   */
  async getStageStats(): Promise<StageStatistics> {
    const response = await apiClient.get<ApiResponse<StageStatistics>>(
      "/recruitment/stages/stats"
    );

    return response.data.data;
  },

  /**
   * Average Stage Duration
   */
  async getAverageDuration(): Promise<StageDuration[]> {
    const response = await apiClient.get<ApiResponse<StageDuration[]>>(
      "/recruitment/stages/average-duration"
    );

    return response.data.data;
  },

  /**
   * Transition Flow
   */
  async getTransitionFlow(): Promise<TransitionFlow[]> {
    const response = await apiClient.get<ApiResponse<TransitionFlow[]>>(
      "/recruitment/stages/transition-flow"
    );

    return response.data.data;
  },
};

export default pipelineService;