import { AnalysisResult, AnalyzeParams, CaseAnalysisResult, CaseAnalyzeParams } from "../types";
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
    throw error;
  }
};

/**
 * Calls the backend API to analyze case paperwork.
 */
export const analyzeCase = async (
  params: CaseAnalyzeParams
): Promise<CaseAnalysisResult> => {
  logger.info("ai", "Calling backend for case analysis");

  try {
    const response = await api.post('/case-analysis', params);
    return response.data;
  } catch (error) {
    logger.error("ai", "Case analysis failed", error);
    throw error;
  }
};

export const createChatSession = async () => {
  throw new Error("Chat session not implemented in backend yet");
};
