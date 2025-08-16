import { AIConfig } from '../types';

export const AI_CONFIG: AIConfig = {
  currentProvider: 'gemini',
  fallbackChain: ['gemini'],
  maxDescriptionLength: 50,
  timeout: 30000,
  retryAttempts: 3
};

export const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  }
};

export const ADMIN_CONFIG = {
  password: import.meta.env.VITE_ADMIN_PASSWORD || '',
  notionApiKey: import.meta.env.VITE_NOTION_API_KEY || '',
  pexelsApiKey: import.meta.env.VITE_PEXELS_API_KEY || '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
};