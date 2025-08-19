/**
 * 環境變數驗證工具
 * 確保必要的環境變數已正確設定
 */

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  availableProviders: string[];
}

export interface EnvironmentConfig {
  // Notion
  notionApiKey?: string;
  
  // Admin
  adminPassword?: string;
  
  // Image Service
  pexelsApiKey?: string;
  
  // AI Providers
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  openrouterApiKey?: string;
  
  // Configuration
  aiProvider?: string;
  nodeEnv?: string;
}

/**
 * 驗證環境變數
 */
export function validateEnvironment(): EnvironmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const availableProviders: string[] = [];

  // 獲取環境變數（優先使用伺服器端變數）
  const config: EnvironmentConfig = {
    // Notion - 必需
    notionApiKey: import.meta.env.VITE_NOTION_API_KEY,
    
    // Admin - 必需
    adminPassword: import.meta.env.VITE_ADMIN_PASSWORD,
    
    // Image Service - 必需
    pexelsApiKey: import.meta.env.VITE_PEXELS_API_KEY,
    
    // AI Providers - 至少需要一個
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    claudeApiKey: import.meta.env.VITE_CLAUDE_API_KEY,
    openrouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    
    // Configuration
    aiProvider: import.meta.env.VITE_AI_PROVIDER,
    nodeEnv: import.meta.env.NODE_ENV || 'development',
  };

  // 驗證必需的環境變數
  const requiredVars = [
    { key: 'notionApiKey', name: 'VITE_NOTION_API_KEY', value: config.notionApiKey },
    { key: 'adminPassword', name: 'VITE_ADMIN_PASSWORD', value: config.adminPassword },
  ];

  for (const { key, name, value } of requiredVars) {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${name}`);
      missingRequired.push(name);
    }
  }

  // 驗證 AI 提供商（至少需要一個）
  const aiProviders = [
    { name: 'Gemini', key: 'gemini', value: config.geminiApiKey },
    { name: 'OpenAI', key: 'openai', value: config.openaiApiKey },
    { name: 'Claude', key: 'claude', value: config.claudeApiKey },
    { name: 'OpenRouter', key: 'openrouter', value: config.openrouterApiKey },
  ];

  for (const provider of aiProviders) {
    if (provider.value && provider.value.trim() !== '') {
      availableProviders.push(provider.key);
    }
  }


  // 檢查 AI 提供商（可選）
  if (availableProviders.length === 0) {
    warnings.push('No AI provider API keys configured - AI features will not be available');
  }

  // 驗證 AI 提供商設定
  if (config.aiProvider) {
    if (!availableProviders.includes(config.aiProvider)) {
      warnings.push(`Configured AI provider "${config.aiProvider}" has no API key. Available: ${availableProviders.join(', ')}`);
    }
  } else if (availableProviders.length > 0) {
    warnings.push(`No AI provider specified. Will use default: ${availableProviders[0]}`);
  }

  // 安全性檢查
  if (config.nodeEnv === 'production') {
    if (config.adminPassword && config.adminPassword.length < 8) {
      warnings.push('Admin password should be at least 8 characters in production');
    }
    
    // 檢查 API 金鑰格式
    if (config.notionApiKey && !config.notionApiKey.startsWith('secret_')) {
      warnings.push('Notion API key format appears invalid (should start with "secret_")');
    }
  }

  // 檢查開發環境配置
  if (config.nodeEnv === 'development') {
    if (!config.notionApiKey?.includes('dev') && !config.notionApiKey?.includes('test')) {
      warnings.push('Consider using a development/test Notion database in development environment');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    availableProviders,
  };
}

/**
 * 記錄環境驗證結果
 */
export function logEnvironmentValidation(result: EnvironmentValidationResult): void {
  if (result.isValid) {
    console.log('✅ Environment validation passed');
    if (result.availableProviders.length > 0) {
      console.log(`🤖 Available AI providers: ${result.availableProviders.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  } else {
    console.error('❌ Environment validation failed');
    console.error('Missing required variables:');
    result.missingRequired.forEach(variable => console.error(`  - ${variable}`));
    
    if (result.errors.length > 0) {
      console.error('Errors:');
      result.errors.forEach(error => console.error(`  - ${error}`));
    }
  }
}

/**
 * 獲取環境配置摘要
 */
export function getEnvironmentSummary(): {
  platform: string;
  nodeEnv: string;
  hasNotionAccess: boolean;
  hasImageService: boolean;
  availableAiProviders: string[];
  defaultAiProvider?: string;
} {
  const validation = validateEnvironment();
  
  return {
    platform: typeof window !== 'undefined' 
      ? (window.location.hostname.includes('netlify') ? 'netlify' : 
         window.location.hostname.includes('vercel') ? 'vercel' : 'unknown')
      : 'server',
    nodeEnv: import.meta.env.NODE_ENV || 'development',
    hasNotionAccess: !!import.meta.env.VITE_NOTION_API_KEY,
    hasImageService: !!import.meta.env.VITE_PEXELS_API_KEY,
    availableAiProviders: validation.availableProviders,
    defaultAiProvider: import.meta.env.VITE_AI_PROVIDER || validation.availableProviders[0],
  };
}

/**
 * 檢查環境是否準備就緒
 */
export function isEnvironmentReady(): boolean {
  return validateEnvironment().isValid;
}

/**
 * 獲取環境配置錯誤訊息（用於 UI 顯示）
 */
export function getEnvironmentErrorMessage(): string | null {
  const result = validateEnvironment();
  
  if (result.isValid) {
    return null;
  }
  
  if (result.missingRequired.length > 0) {
    return `Missing required environment variables: ${result.missingRequired.join(', ')}. Please check your .env file.`;
  }
  
  return 'Environment configuration is invalid. Please check your environment variables.';
}