import axios from 'axios';
import { authStore } from '@/stores/authStore';
import type { ApplyPlanResult, GeneratePlanResponse, LlmInput, Plan } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = authStore.get().jwtToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const plannerService = {
  async generatePlan(llmInput: LlmInput): Promise<GeneratePlanResponse> {
    try {
      const response = await axios.post<GeneratePlanResponse>(
        `${API_BASE_URL}/plan`,
        llmInput,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to generate plan.');
      }
      throw new Error('An unexpected error occurred during plan generation.');
    }
  },

  async getPlan(planId: string): Promise<{ plan: Plan }> {
    try {
      const response = await axios.get<{ plan: Plan }>(
        `${API_BASE_URL}/plan/${planId}`,
        { headers: getAuthHeaders() },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Failed to fetch plan ${planId}.`);
      }
      throw new Error(`An unexpected error occurred while fetching plan ${planId}.`);
    }
  },

  async applyPlan(plan: Plan): Promise<ApplyPlanResult> {
    try {
      const response = await axios.post<ApplyPlanResult>(
        `${API_BASE_URL}/plan/apply`,
        { plan }, // Backend expects { plan: PlanDto }
        { headers: getAuthHeaders() },
      );
      return response.data.result; // Backend returns { ok: true, result: ApplyPlanResult }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Failed to apply plan.');
      }
      throw new Error('An unexpected error occurred during plan application.');
    }
  },

  // Future: Add applyChunk if needed
  // async applyChunk(planId: string, chunkIndex: number): Promise<any> {
  //   try {
  //     const response = await axios.post(
  //       `${API_BASE_URL}/api/plan/${planId}/apply-chunk/${chunkIndex}`,
  //       {},
  //       { headers: getAuthHeaders() },
  //     );
  //     return response.data;
  //   } catch (error) {
  //     if (axios.isAxiosError(error) && error.response) {
  //       throw new Error(error.response.data.message || 'Failed to apply chunk.');
  //     }
  //     throw new Error('An unexpected error occurred during chunk application.');
  //   }
  // },
};
