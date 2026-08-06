/**
 * Analytics Types
 */

import { DepartmentSummary, TeamSummary } from './dashboard.types';

export interface UtilizationTrend {
  period: string;
  utilization: number;
  capacity: number;
  allocated: number;
}

export interface DepartmentComparison {
  departmentId: number;
  departmentName: string;
  utilizationPercentage: number;
  employeeCount: number;
}

export interface TeamComparison {
  teamId: number;
  teamName: string;
  utilizationPercentage: number;
  memberCount: number;
}

export interface BenchmarkData {
  metric: string;
  value: number;
  target: number;
  status: 'exceeding' | 'meeting' | 'below';
}

export interface ForecastData {
  period: string;
  predictedUtilization: number;
  actualUtilization?: number;
  confidence: number;
}

export interface AnalyticsData {
  trends: UtilizationTrend[];
  departments: DepartmentComparison[];
  teams: TeamComparison[];
  benchmarks: BenchmarkData[];
  forecasts: ForecastData[];
  kpis: {
    overallUtilization: number;
    benchPercentage: number;
    overUtilizedCount: number;
    underUtilizedCount: number;
  };
}