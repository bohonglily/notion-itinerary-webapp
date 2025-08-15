#!/usr/bin/env node

/**
 * 多平台部署腳本
 * 根據指定的平台執行相應的部署流程
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLATFORMS = {
  netlify: {
    name: 'Netlify',
    buildCommand: 'npm run build:netlify',
    deployCommand: 'npm run deploy:netlify',
    configFile: 'netlify.toml',
    functions: 'netlify/functions',
  },
  vercel: {
    name: 'Vercel',
    buildCommand: 'npm run build:vercel',
    deployCommand: 'npm run deploy:vercel',
    configFile: 'vercel.json',
    functions: 'api',
  }
};

function printUsage() {
  console.log('使用方式: node scripts/deploy.js <platform> [options]');
  console.log('');
  console.log('平台選項:');
  Object.entries(PLATFORMS).forEach(([key, platform]) => {
    console.log(`  ${key.padEnd(10)} - 部署到 ${platform.name}`);
  });
  console.log('');
  console.log('選項:');
  console.log('  --dry-run    - 只顯示將執行的命令，不實際執行');
  console.log('  --build-only - 只執行建置，不部署');
  console.log('  --help       - 顯示此幫助訊息');
  console.log('');
  console.log('範例:');
  console.log('  node scripts/deploy.js netlify');
  console.log('  node scripts/deploy.js vercel --dry-run');
  console.log('  node scripts/deploy.js netlify --build-only');
}

function checkPlatformConfig(platformKey) {
  const platform = PLATFORMS[platformKey];
  const issues = [];

  // 檢查配置檔案
  if (!fs.existsSync(platform.configFile)) {
    issues.push(`配置檔案 ${platform.configFile} 不存在`);
  }

  // 檢查函數目錄
  if (!fs.existsSync(platform.functions)) {
    issues.push(`函數目錄 ${platform.functions} 不存在`);
  }

  // 檢查必要的 npm scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = [
    platform.buildCommand.replace('npm run ', ''),
    platform.deployCommand.replace('npm run ', ''),
  ];

  requiredScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      issues.push(`缺少 npm script: ${script}`);
    }
  });

  return issues;
}

function executeCommand(command, dryRun = false) {
  console.log(`執行: ${command}`);
  
  if (dryRun) {
    console.log('  (乾燥運行模式 - 未實際執行)');
    return;
  }

  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`命令執行失敗: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function deploy(platformKey, options = {}) {
  const { dryRun = false, buildOnly = false } = options;
  const platform = PLATFORMS[platformKey];

  console.log(`開始部署到 ${platform.name}...`);
  console.log('=====================================');

  // 檢查平台配置
  console.log('1. 檢查平台配置...');
  const issues = checkPlatformConfig(platformKey);
  if (issues.length > 0) {
    console.error('配置檢查失敗:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }
  console.log('   ✓ 配置檢查通過');

  // 執行建置
  console.log('2. 執行建置...');
  executeCommand(platform.buildCommand, dryRun);
  console.log('   ✓ 建置完成');

  if (buildOnly) {
    console.log('只執行建置模式，跳過部署步驟');
    return;
  }

  // 執行部署
  console.log('3. 執行部署...');
  executeCommand(platform.deployCommand, dryRun);
  console.log('   ✓ 部署完成');

  console.log('=====================================');
  console.log(`${platform.name} 部署成功！`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    return;
  }

  const platformKey = args[0];
  const options = {
    dryRun: args.includes('--dry-run'),
    buildOnly: args.includes('--build-only'),
  };

  if (!PLATFORMS[platformKey]) {
    console.error(`不支援的平台: ${platformKey}`);
    console.error(`支援的平台: ${Object.keys(PLATFORMS).join(', ')}`);
    process.exit(1);
  }

  deploy(platformKey, options);
}

if (require.main === module) {
  main();
}