import { AIConfig } from '../types';

export const AI_CONFIG: AIConfig = {
  currentProvider: import.meta.env.VITE_AI_PROVIDER || 'gemini',
  fallbackChain: ['gemini', 'openai', 'claude'],
  maxDescriptionLength: 50,
  timeout: 30000,
  retryAttempts: 3
};

export const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY
  },
  claude: {
    name: 'Anthropic Claude',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_CLAUDE_API_KEY
  },
  openrouter: {
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    model: import.meta.env.VITE_OPENROUTER_MODEL || 'openrouter/cinematika-7b'
  }
};

export const ADMIN_CONFIG = {
  password: import.meta.env.VITE_ADMIN_PASSWORD || '',
  notionApiKey: import.meta.env.VITE_NOTION_API_KEY || '',
  pexelsApiKey: import.meta.env.VITE_PEXELS_API_KEY || ''
};