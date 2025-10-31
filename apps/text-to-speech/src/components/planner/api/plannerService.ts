import axios from 'axios';
import { authStore } from '@/stores/authStore';
import type { IApplyPlanResult, IGeneratePlanResponse, ILlmInput, IPlan } from '../types'; // Updated imports

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = authStore.get().token; // Corrected from jwtToken to token
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const plannerService = {
  async generatePlan(llmInput: ILlmInput): Promise<IGeneratePlanResponse> {
    try {
      const response = await axios.post<IGeneratePlanResponse>(
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

  async getPlan(planId: string): Promise<{ plan: IPlan }> { // Updated return type
    try {
      const response = await axios.get<{ plan: IPlan }>(
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

  async applyPlan(plan: IPlan, projectRoot?: string): Promise<IApplyPlanResult> { // Updated parameter type
    try {
      // Backend expects { planId: string, projectRoot?: string } in ApplyExistingPlanRequestDto
      const response = await axios.post<{ result: IApplyPlanResult }>(
        `${API_BASE_URL}/plan/apply`,
        { planId: plan.id, projectRoot }, // Corrected payload to match backend DTO
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
