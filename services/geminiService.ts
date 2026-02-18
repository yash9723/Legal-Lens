import { AnalysisResult, AnalyzeParams } from "../types";
import api from "./api";
import { logger } from "./loggerService";

/**
 * Calls the backend API to analyze the contract.
 */
export const analyzeContract = async (
  params: AnalyzeParams
): Promise<AnalysisResult> => {
  logger.info("ai", "Calling backend for analysis");

  try {
    const response = await api.post('/analyze', params);
    return response.data;
  } catch (error) {
    logger.error("ai", "Analysis failed", error);
    // Fallback or rethrow
    throw error;
  }
};

export const createChatSession = async () => {
  // Implement chat session if backend supports it, otherwise keep stub or remove
  throw new Error("Chat session not implemented in backend yet");
};
