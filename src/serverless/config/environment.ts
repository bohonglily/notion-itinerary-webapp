/**
 * 環境配置管理
 * 處理不同平台的環境變數適配
 */

export interface EnvironmentConfig {
  notionApiKey: string;
  pexelsApiKey: string;
  adminPassword: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  openrouterApiKey?: string;
  aiProvider?: string;
}

export class EnvironmentManager {
  private static config: EnvironmentConfig | null = null;

  /**
   * 獲取環境配置
   * 根據不同平台適配環境變數名稱
   */
  static getConfig(): EnvironmentConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * 載入環境配置
   */
  private static loadConfig(): EnvironmentConfig {
    // 根據平台獲取環境變數
    const getEnvVar = (varNames: string[]): string | undefined => {
      for (const varName of varNames) {
        const value = process.env[varName];
        if (value) return value;
      }
      return undefined;
    };

    // Notion API Key - 支援多種命名方式
    const notionApiKey = getEnvVar([
      'VITE_NOTION_API_KEY',  // Vite 開發環境
      'NOTION_API_KEY',       // 標準命名
      'NEXT_PUBLIC_NOTION_API_KEY', // Next.js 公開變數
    ]);

    // Pexels API Key
    const pexelsApiKey = getEnvVar([
      'VITE_PEXELS_API_KEY',
      'PEXELS_API_KEY',
      'NEXT_PUBLIC_PEXELS_API_KEY',
    ]);

    // Admin Password
    const adminPassword = getEnvVar([
      'VITE_ADMIN_PASSWORD',
      'ADMIN_PASSWORD',
      'NEXT_PUBLIC_ADMIN_PASSWORD',
    ]);

    // AI API Keys
    const geminiApiKey = getEnvVar([
      'VITE_GEMINI_API_KEY',
      'GEMINI_API_KEY',
      'NEXT_PUBLIC_GEMINI_API_KEY',
    ]);

    const openaiApiKey = getEnvVar([
      'VITE_OPENAI_API_KEY',
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_OPENAI_API_KEY',
    ]);

    const claudeApiKey = getEnvVar([
      'VITE_CLAUDE_API_KEY',
      'CLAUDE_API_KEY',
      'NEXT_PUBLIC_CLAUDE_API_KEY',
      'ANTHROPIC_API_KEY',
    ]);

    const openrouterApiKey = getEnvVar([
      'VITE_OPENROUTER_API_KEY',
      'OPENROUTER_API_KEY',
      'NEXT_PUBLIC_OPENROUTER_API_KEY',
    ]);

    const aiProvider = getEnvVar([
      'VITE_AI_PROVIDER',
      'AI_PROVIDER',
      'NEXT_PUBLIC_AI_PROVIDER',
    ]);

    // 驗證必要的環境變數
    if (!notionApiKey) {
      throw new Error('Notion API Key is required but not found in environment variables');
    }

    if (!pexelsApiKey) {
      console.warn('Pexels API Key not found, image search functionality will be disabled');
    }

    if (!adminPassword) {
      console.warn('Admin password not found, admin functionality will be disabled');
    }

    return {
      notionApiKey: notionApiKey!,
      pexelsApiKey: pexelsApiKey || '',
      adminPassword: adminPassword || '',
      geminiApiKey,
      openaiApiKey,
      claudeApiKey,
      openrouterApiKey,
      aiProvider: aiProvider || 'gemini',
    };
  }

  /**
   * 檢查是否為開發環境
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NETLIFY_DEV === 'true' ||
           process.env.VERCEL_ENV === 'development';
  }

  /**
   * 檢查是否為生產環境
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production' ||
           process.env.NETLIFY_ENV === 'production' ||
           process.env.VERCEL_ENV === 'production';
  }

  /**
   * 獲取當前環境名稱
   */
  static getEnvironment(): string {
    if (this.isDevelopment()) return 'development';
    if (this.isProduction()) return 'production';
    return 'unknown';
  }

  /**
   * 重新載入配置（用於測試或配置更新）
   */
  static reloadConfig(): EnvironmentConfig {
    this.config = null;
    return this.getConfig();
  }
}