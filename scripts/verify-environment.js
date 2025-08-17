#!/usr/bin/env node

/**
 * Environment Verification Script
 * Verifies that all required environment variables are set for the given environment
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const requiredVars = {
  production: [
    'VITE_NOTION_API_KEY',
    'NOTION_API_KEY',
    'VITE_ADMIN_PASSWORD',
    'VITE_PEXELS_API_KEY',
    'PEXELS_API_KEY'
  ],
  staging: [
    'VITE_NOTION_API_KEY',
    'NOTION_API_KEY',
    'VITE_ADMIN_PASSWORD',
    'VITE_PEXELS_API_KEY',
    'PEXELS_API_KEY'
  ],
  development: [
    'VITE_NOTION_API_KEY',
    'VITE_ADMIN_PASSWORD',
    'VITE_PEXELS_API_KEY'
  ]
};

const aiProviders = [
  'VITE_GEMINI_API_KEY',
  'VITE_OPENAI_API_KEY', 
  'VITE_CLAUDE_API_KEY',
  'VITE_OPENROUTER_API_KEY'
];

function verifyEnvironment(env = 'development') {
  console.log(`🔍 Verifying environment: ${env.toUpperCase()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const missing = [];
  const warnings = [];
  
  // Check required variables
  const required = requiredVars[env] || requiredVars.development;
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });

  // Check AI providers (at least one required)
  const availableAI = aiProviders.filter(provider => process.env[provider]);
  
  if (availableAI.length === 0) {
    missing.push('At least one AI provider (Gemini, OpenAI, Claude, or OpenRouter)');
  } else {
    console.log(`\n🤖 Available AI Providers:`);
    availableAI.forEach(provider => {
      console.log(`✅ ${provider}: Set`);
    });
  }

  // Check optional but recommended variables
  const optionalVars = ['VITE_AI_PROVIDER'];
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`${varName} not set - will use default`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n💡 Please check your .env file or environment settings.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log(`✅ Environment verification passed for ${env.toUpperCase()}`);
  
  // Display environment info
  console.log('\n📊 Environment Info:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   VITE_ENV: ${process.env.VITE_ENV || 'not set'}`);
  console.log(`   AI Provider: ${process.env.VITE_AI_PROVIDER || 'auto-detect'}`);
  
  return true;
}

// Get environment from command line argument
const env = process.argv[2] || process.env.NODE_ENV || 'development';

try {
  verifyEnvironment(env);
} catch (error) {
  console.error('❌ Environment verification failed:', error.message);
  process.exit(1);
}