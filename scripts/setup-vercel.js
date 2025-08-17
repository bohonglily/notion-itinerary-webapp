#!/usr/bin/env node

/**
 * Vercel Multi-Environment Setup Script
 * Automates the initial setup process for Vercel deployments
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function setupVercel() {
  console.log('🚀 Vercel Multi-Environment Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
      console.log('✅ Vercel CLI is installed');
    } catch {
      console.log('📦 Installing Vercel CLI...');
      runCommand('npm install -g vercel', 'Vercel CLI installation');
    }

    // Check if user is logged in
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Already logged in to Vercel');
    } catch {
      console.log('🔐 Please log in to Vercel...');
      runCommand('vercel login', 'Vercel login');
    }

    // Setup project
    console.log('\n📁 Setting up Vercel project...');
    const setupProject = await question('Setup new Vercel project? (y/n): ');
    
    if (setupProject.toLowerCase() === 'y') {
      console.log('Setting up project (follow the prompts)...');
      runCommand('vercel', 'Project setup');
    }

    // Get project information
    console.log('\n📊 Getting project information...');
    const projectInfo = runCommand('vercel project ls', 'Project information retrieval');
    console.log('Project information:');
    console.log(projectInfo);

    // Environment setup
    console.log('\n🔧 Environment Variables Setup');
    console.log('Please set up the following environment variables in Vercel Dashboard:');
    console.log('https://vercel.com/dashboard → Your Project → Settings → Environment Variables');
    
    const requiredVars = [
      { name: 'NODE_ENV', production: 'production', staging: 'staging' },
      { name: 'VITE_ENV', production: 'production', staging: 'staging' },
      { name: 'VITE_NOTION_API_KEY', production: 'your_prod_key', staging: 'your_staging_key' },
      { name: 'VITE_ADMIN_PASSWORD', production: 'secure_prod_password', staging: 'staging_password' },
      { name: 'VITE_PEXELS_API_KEY', production: 'your_pexels_key', staging: 'your_pexels_key' }
    ];

    console.log('\n📋 Required Environment Variables:');
    requiredVars.forEach(varInfo => {
      console.log(`\n${varInfo.name}:`);
      console.log(`  Production: ${varInfo.production}`);
      console.log(`  Staging: ${varInfo.staging}`);
    });

    // GitHub Secrets setup
    console.log('\n🔐 GitHub Secrets Setup');
    console.log('Add these secrets to your GitHub repository:');
    console.log('GitHub → Settings → Secrets and variables → Actions');
    console.log('\nRequired secrets:');
    console.log('- VERCEL_TOKEN (get from https://vercel.com/account/tokens)');
    console.log('- VERCEL_ORG_ID (from vercel project ls)');
    console.log('- VERCEL_PROJECT_ID (from vercel project ls)');

    // Deployment test
    const testDeploy = await question('\nTest deployment now? (y/n): ');
    if (testDeploy.toLowerCase() === 'y') {
      console.log('🧪 Testing deployment...');
      
      // Verify environment first
      runCommand('npm run env:verify', 'Environment verification');
      
      // Test build
      runCommand('npm run build', 'Build test');
      
      // Deploy to preview
      runCommand('vercel --target preview', 'Preview deployment');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Configure environment variables in Vercel Dashboard');
    console.log('2. Add GitHub secrets for automatic deployments');
    console.log('3. Push to clean-main branch to test staging deployment');
    console.log('4. Push to main branch for production deployment');
    console.log('\n📖 See docs/VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have npm installed');
    console.log('2. Check your internet connection');
    console.log('3. Verify Vercel account access');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Helper function to check environment
function checkEnvironment() {
  console.log('\n🔍 Checking current environment...');
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    console.log(`✅ Project: ${packageJson.name}`);
    console.log(`✅ Version: ${packageJson.version}`);
  } catch {
    console.log('❌ package.json not found - make sure you\'re in the project directory');
    process.exit(1);
  }

  // Check git status
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`✅ Current branch: ${branch}`);
  } catch {
    console.log('⚠️  Not in a git repository or git not available');
  }
}

// Main execution
console.log('🎯 Notion Itinerary WebApp - Vercel Setup');
checkEnvironment();
setupVercel();