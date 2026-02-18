
import { AnalysisResult, SavedAnalysis } from "../types";
import { logger } from "./loggerService";

const STORAGE_KEY = 'legallens_history_v1';

export const StorageService = {
  /**
   * Saves an analysis result to local history.
   */
  saveAnalysis: (
    result: AnalysisResult, 
    type: 'text' | 'image', 
    fileName: string, 
    userId: string | null
  ): SavedAnalysis => {
    try {
      const history = StorageService.getHistory();
      
      const newEntry: SavedAnalysis = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        userId,
        fileName: fileName || `Untitled Scan ${new Date().toLocaleDateString()}`,
        date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: Date.now(),
        type,
        result,
        previewText: result.oneLineOverview.substring(0, 100) + '...'
      };

      // Add to beginning of array
      const updatedHistory = [newEntry, ...history];
      
      // Limit to last 20 items to prevent localStorage quota issues
      if (updatedHistory.length > 20) {
        updatedHistory.pop();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      logger.info('system', 'Analysis saved to history', { id: newEntry.id, fileName });
      return newEntry;
    } catch (error) {
      logger.error('system', 'Failed to save analysis history', error);
      throw error;
    }
  },

  /**
   * Retrieves all saved analyses, optionally filtered by userId.
   */
  getHistory: (userId?: string | null): SavedAnalysis[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      
      const parsed = JSON.parse(raw) as SavedAnalysis[];
      
      // If a userId is provided, we could filter. 
      // For this demo, we show everything stored locally + associated with current user
      if (userId) {
        return parsed.filter(item => item.userId === userId || item.userId === null);
      }
      
      return parsed;
    } catch (error) {
      logger.error('system', 'Failed to retrieve history', error);
      return [];
    }
  },

  /**
   * Deletes a specific analysis by ID.
   */
  deleteAnalysis: (id: string): void => {
    try {
      const history = StorageService.getHistory();
      const updated = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      logger.info('system', 'Analysis deleted from history', { id });
    } catch (error) {
      logger.error('system', 'Failed to delete analysis', error);
    }
  },

  /**
   * Clears all history.
   */
  clearHistory: (): void => {
    localStorage.removeItem(STORAGE_KEY);
    logger.info('system', 'History cleared');
  }
};
