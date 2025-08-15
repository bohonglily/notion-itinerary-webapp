/**
 * 部署平台配置管理
 * 根據不同平台提供相應的配置
 */

export type DeploymentPlatform = 'netlify' | 'vercel' | 'aws' | 'local' | 'unknown';

export interface PlatformConfig {
  platform: DeploymentPlatform;
  functionPath: string;
  apiBasePath: string;
  maxExecutionTime: number;
  memoryLimit?: number;
  environmentPrefix: string;
}

export class DeploymentManager {
  private static platformConfigs: Record<DeploymentPlatform, Partial<PlatformConfig>> = {
    netlify: {
      platform: 'netlify',
      functionPath: '/.netlify/functions',
      apiBasePath: '/.netlify/functions',
      maxExecutionTime: 10000, // 10 seconds
      environmentPrefix: 'NETLIFY_',
    },
    vercel: {
      platform: 'vercel',
      functionPath: '/api',
      apiBasePath: '/api',
      maxExecutionTime: 30000, // 30 seconds (Vercel Pro)
      environmentPrefix: 'VERCEL_',
    },
    aws: {
      platform: 'aws',
      functionPath: '/prod',
      apiBasePath: '/prod',
      maxExecutionTime: 300000, // 5 minutes
      memoryLimit: 512,
      environmentPrefix: 'AWS_',
    },
    local: {
      platform: 'local',
      functionPath: '/api',
      apiBasePath: '/api',
      maxExecutionTime: 30000,
      environmentPrefix: 'LOCAL_',
    },
    unknown: {
      platform: 'unknown',
      functionPath: '/api',
      apiBasePath: '/api',
      maxExecutionTime: 10000,
      environmentPrefix: '',
    },
  };

  /**
   * 檢測當前部署平台
   */
  static detectPlatform(): DeploymentPlatform {
    // Netlify 檢測
    if (process.env.NETLIFY === 'true' || 
        process.env.NETLIFY_DEV === 'true' || 
        process.env.NETLIFY_ENV) {
      return 'netlify';
    }
    
    // Vercel 檢測
    if (process.env.VERCEL === '1' || 
        process.env.VERCEL_ENV || 
        process.env.VERCEL_URL) {
      return 'vercel';
    }
    
    // AWS Lambda 檢測
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || 
        process.env.LAMBDA_TASK_ROOT ||
        process.env.AWS_EXECUTION_ENV) {
      return 'aws';
    }

    // 本地開發檢測
    if (process.env.NODE_ENV === 'development') {
      return 'local';
    }
    
    return 'unknown';
  }

  /**
   * 獲取當前平台配置
   */
  static getPlatformConfig(): PlatformConfig {
    const platform = this.detectPlatform();
    const config = this.platformConfigs[platform];
    
    return {
      platform,
      functionPath: config.functionPath || '/api',
      apiBasePath: config.apiBasePath || '/api',
      maxExecutionTime: config.maxExecutionTime || 10000,
      memoryLimit: config.memoryLimit,
      environmentPrefix: config.environmentPrefix || '',
    };
  }

  /**
   * 獲取 API 端點 URL
   */
  static getApiEndpoint(functionName: string): string {
    const config = this.getPlatformConfig();
    return `${config.apiBasePath}/${functionName}`;
  }

  /**
   * 獲取平台特定的環境變數
   */
  static getPlatformEnvVar(key: string): string | undefined {
    const config = this.getPlatformConfig();
    return process.env[`${config.environmentPrefix}${key}`] || process.env[key];
  }

  /**
   * 檢查當前是否為無伺服器環境
   */
  static isServerlessEnvironment(): boolean {
    const platform = this.detectPlatform();
    return ['netlify', 'vercel', 'aws'].includes(platform);
  }

  /**
   * 獲取平台資訊摘要
   */
  static getPlatformInfo() {
    const config = this.getPlatformConfig();
    return {
      platform: config.platform,
      isServerless: this.isServerlessEnvironment(),
      apiBasePath: config.apiBasePath,
      maxExecutionTime: config.maxExecutionTime,
      memoryLimit: config.memoryLimit,
      environmentVars: {
        NODE_ENV: process.env.NODE_ENV,
        platform_env: this.getPlatformEnvVar('ENV'),
      },
    };
  }

  /**
   * 驗證平台兼容性
   */
  static validatePlatformCompatibility(): { 
    compatible: boolean; 
    issues: string[]; 
  } {
    const issues: string[] = [];
    const config = this.getPlatformConfig();

    // 檢查執行時間限制
    if (config.maxExecutionTime < 5000) {
      issues.push('執行時間限制可能不足以處理複雜的 Notion 查詢');
    }

    // 檢查記憶體限制 (如果有的話)
    if (config.memoryLimit && config.memoryLimit < 256) {
      issues.push('記憶體限制可能不足以處理大型資料集');
    }

    // 檢查環境變數可用性
    if (config.platform === 'unknown') {
      issues.push('無法識別部署平台，可能影響功能正常運作');
    }

    return {
      compatible: issues.length === 0,
      issues,
    };
  }
}