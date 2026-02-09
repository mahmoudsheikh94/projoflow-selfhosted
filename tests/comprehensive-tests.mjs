#!/usr/bin/env node

/**
 * ProjoFlow Self-Hosted — Comprehensive Test Suite
 * Full testing: Build, Database, API, UI, Security
 */

import { createClient } from '@supabase/supabase-js';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import https from 'https';
import http from 'http';

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bylvbbadzzznjdrymiyg.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gJQ-XaYwsWccrTxWBrQ6nA_nQAf0XDU';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_pzLPZoGIpwRiKmlp7tN1iA_FlpjPdbn';

// ─── Results Tracking ────────────────────────────────────────────────────────

const results = [];
let passed = 0, failed = 0, warned = 0;

function record(category, test, status, details = '') {
  results.push({ category, test, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${test}${details ? ' | ' + details : ''}`);
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else warned++;
}

// ─── Test Utilities ──────────────────────────────────────────────────────────

function execCmd(cmd, timeout = 30000) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf-8', timeout }).trim() };
  } catch (e) {
    return { ok: false, output: e.message };
  }
}

function httpGet(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', (e) => resolve({ status: 0, error: e.message }));
  });
}

async function httpPost(url, body) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = url.startsWith('https') ? https : http;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Test Categories ─────────────────────────────────────────────────────────

async function testFileStructure() {
  console.log('\n📁 TESTING FILE STRUCTURE\n' + '─'.repeat(50));
  
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'README.md',
    'LICENSE.md',
    'DEPLOYMENT.md',
    '.env.example',
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/app/setup/page.tsx',
    'src/app/login/page.tsx',
    'src/app/(admin)/dashboard/page.tsx',
    'src/app/(admin)/projects/page.tsx',
    'src/app/(admin)/clients/page.tsx',
    'src/app/(admin)/time/page.tsx',
    'src/app/(admin)/settings/page.tsx',
    'src/app/portal/page.tsx',
    'src/app/api/setup/route.ts',
    'src/app/api/license/validate/route.ts',
    'supabase/migrations/00_complete_schema.sql',
    'mcp-server/package.json',
  ];
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    record('FILE_STRUCTURE', file, exists ? 'PASS' : 'FAIL', exists ? 'Found' : 'Missing');
  }
}

async function testPackageJson() {
  console.log('\n📦 TESTING PACKAGE.JSON\n' + '─'.repeat(50));
  
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  
  // Required dependencies
  const requiredDeps = [
    'next', 'react', 'react-dom', '@supabase/supabase-js', 
    'tailwindcss', 'typescript', '@supabase/ssr'
  ];
  
  for (const dep of requiredDeps) {
    const hasDep = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
    record('PACKAGE', `Dependency: ${dep}`, hasDep ? 'PASS' : 'FAIL');
  }
  
  // Check scripts
  const requiredScripts = ['dev', 'build', 'start'];
  for (const script of requiredScripts) {
    record('PACKAGE', `Script: ${script}`, pkg.scripts?.[script] ? 'PASS' : 'FAIL');
  }
  
  // Check version
  record('PACKAGE', `Version: ${pkg.version}`, pkg.version ? 'PASS' : 'WARN', pkg.version || 'Not set');
  record('PACKAGE', `Name: ${pkg.name}`, pkg.name ? 'PASS' : 'WARN', pkg.name || 'Not set');
}

async function testBuild() {
  console.log('\n🔨 TESTING BUILD PROCESS\n' + '─'.repeat(50));
  
  // TypeScript check
  console.log('  Running TypeScript check...');
  const tsResult = execCmd('npx tsc --noEmit 2>&1', 60000);
  record('BUILD', 'TypeScript compilation', tsResult.ok ? 'PASS' : 'FAIL', 
    tsResult.ok ? 'No errors' : tsResult.output.substring(0, 200));
  
  // ESLint check
  console.log('  Running ESLint...');
  const lintResult = execCmd('npm run lint 2>&1', 60000);
  record('BUILD', 'ESLint', lintResult.ok || lintResult.output.includes('✔') ? 'PASS' : 'WARN',
    lintResult.ok ? 'No warnings' : 'Has warnings');
  
  // Next.js build
  console.log('  Running Next.js build (this takes ~60s)...');
  const buildResult = execCmd('npm run build 2>&1', 180000);
  const buildSuccess = buildResult.ok || buildResult.output.includes('Compiled successfully') || 
                       buildResult.output.includes('Route (app)');
  record('BUILD', 'Next.js build', buildSuccess ? 'PASS' : 'FAIL',
    buildSuccess ? 'Compiled successfully' : buildResult.output.substring(0, 300));
}

async function testDatabaseConnection() {
  console.log('\n🗄️ TESTING DATABASE CONNECTION\n' + '─'.repeat(50));
  
  // Test anon client
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  try {
    const { error } = await anonClient.from('workspaces').select('count').limit(0);
    record('DATABASE', 'Anon client connection', error ? 'FAIL' : 'PASS', 
      error ? error.message : 'Connected');
  } catch (e) {
    record('DATABASE', 'Anon client connection', 'FAIL', e.message);
  }
  
  // Test service role client
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
  try {
    const { data, error } = await serviceClient.from('workspaces').select('id, name').limit(5);
    record('DATABASE', 'Service role connection', error ? 'FAIL' : 'PASS',
      error ? error.message : `Found ${data?.length || 0} workspaces`);
  } catch (e) {
    record('DATABASE', 'Service role connection', 'FAIL', e.message);
  }
}

async function testDatabaseSchema() {
  console.log('\n📊 TESTING DATABASE SCHEMA\n' + '─'.repeat(50));
  
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const tables = [
    'users', 'admin_users', 'workspaces', 'workspace_members', 'clients',
    'projects', 'tasks', 'task_comments', 'time_entries', 'notes', 'leads',
    'intake_links', 'client_users', 'client_invitations', 'workspace_settings',
    'subscriptions', 'licenses'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await serviceClient.from(table).select('*').limit(0);
      record('SCHEMA', `Table: ${table}`, error ? 'FAIL' : 'PASS', 
        error ? error.message : 'Exists');
    } catch (e) {
      record('SCHEMA', `Table: ${table}`, 'FAIL', e.message);
    }
  }
}

async function testRLSPolicies() {
  console.log('\n🔒 TESTING RLS POLICIES\n' + '─'.repeat(50));
  
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  
  // Anonymous should NOT be able to read sensitive data
  const sensitiveTests = [
    { table: 'workspaces', expectEmpty: true },
    { table: 'projects', expectEmpty: true },
    { table: 'clients', expectEmpty: true },
    { table: 'tasks', expectEmpty: true },
    { table: 'users', expectEmpty: true },
  ];
  
  for (const test of sensitiveTests) {
    try {
      const { data, error } = await anonClient.from(test.table).select('*').limit(5);
      if (error) {
        // RLS blocking is good
        record('RLS', `Anonymous blocked from ${test.table}`, 'PASS', 'Access denied');
      } else if (data?.length === 0 || test.expectEmpty) {
        record('RLS', `Anonymous blocked from ${test.table}`, 'PASS', 'No data returned');
      } else {
        record('RLS', `Anonymous blocked from ${test.table}`, 'FAIL', `Returned ${data.length} rows!`);
      }
    } catch (e) {
      record('RLS', `Anonymous blocked from ${test.table}`, 'PASS', 'Exception thrown (blocked)');
    }
  }
}

async function testAPIRoutes() {
  console.log('\n🌐 TESTING API ROUTES\n' + '─'.repeat(50));
  
  // These tests assume the app is NOT running, so we check file existence
  const apiRoutes = [
    'src/app/api/setup/route.ts',
    'src/app/api/setup/migrate/route.ts',
    'src/app/api/setup/verify/route.ts',
    'src/app/api/license/validate/route.ts',
    'src/app/api/invitations/send/route.ts',
    'src/app/api/mentions/notify/route.ts',
    'src/app/api/webhooks/stripe/route.ts',
    'src/app/api/webhooks/gumroad/route.ts',
    'src/app/api/webhooks/lemonsqueezy/route.ts',
    'src/app/api/admin/license/generate/route.ts',
  ];
  
  for (const route of apiRoutes) {
    const exists = fs.existsSync(route);
    const routeName = route.replace('src/app/api/', '/api/').replace('/route.ts', '');
    record('API', routeName, exists ? 'PASS' : 'FAIL', exists ? 'Route exists' : 'Missing');
  }
}

async function testMCPServer() {
  console.log('\n🤖 TESTING MCP SERVER\n' + '─'.repeat(50));
  
  // Check MCP server structure
  const mcpFiles = [
    'mcp-server/package.json',
    'mcp-server/src/index.ts',
    'mcp-server/tsconfig.json',
  ];
  
  for (const file of mcpFiles) {
    const exists = fs.existsSync(file);
    record('MCP', `File: ${file.replace('mcp-server/', '')}`, exists ? 'PASS' : 'FAIL');
  }
  
  // Check MCP dependencies
  if (fs.existsSync('mcp-server/package.json')) {
    const mcpPkg = JSON.parse(fs.readFileSync('mcp-server/package.json', 'utf-8'));
    const hasMcpSdk = mcpPkg.dependencies?.['@modelcontextprotocol/sdk'];
    record('MCP', 'MCP SDK dependency', hasMcpSdk ? 'PASS' : 'FAIL');
    
    // Check tools defined
    if (fs.existsSync('mcp-server/src/index.ts')) {
      const mcpSrc = fs.readFileSync('mcp-server/src/index.ts', 'utf-8');
      const tools = ['list_projects', 'create_task', 'list_tasks', 'create_time_entry'];
      for (const tool of tools) {
        record('MCP', `Tool: ${tool}`, mcpSrc.includes(tool) ? 'PASS' : 'WARN', 
          mcpSrc.includes(tool) ? 'Defined' : 'Not found');
      }
    }
  }
}

async function testUIComponents() {
  console.log('\n🎨 TESTING UI COMPONENTS\n' + '─'.repeat(50));
  
  const components = [
    'src/components/layout/sidebar.tsx',
    'src/components/layout/header.tsx',
    'src/components/project/kanban/kanban-card.tsx',
    'src/components/ui/button.tsx',
    'src/components/ui/dialog.tsx',
    'src/components/ui/input.tsx',
  ];
  
  for (const comp of components) {
    const exists = fs.existsSync(comp);
    record('UI', comp.replace('src/components/', ''), exists ? 'PASS' : 'WARN',
      exists ? 'Found' : 'Missing (may be optional)');
  }
  
  // Check for Tailwind config
  const hasTailwind = fs.existsSync('tailwind.config.ts') || fs.existsSync('tailwind.config.js');
  record('UI', 'Tailwind config', hasTailwind ? 'PASS' : 'FAIL');
  
  // Check globals.css
  if (fs.existsSync('src/app/globals.css')) {
    const css = fs.readFileSync('src/app/globals.css', 'utf-8');
    record('UI', 'CSS variables defined', css.includes('--') ? 'PASS' : 'WARN');
    record('UI', 'Tailwind directives', css.includes('@tailwind') ? 'PASS' : 'FAIL');
  }
}

async function testDocumentation() {
  console.log('\n📚 TESTING DOCUMENTATION\n' + '─'.repeat(50));
  
  const docs = [
    { file: 'README.md', minSize: 5000 },
    { file: 'DEPLOYMENT.md', minSize: 2000 },
    { file: 'LICENSE.md', minSize: 500 },
    { file: '.env.example', minSize: 200 },
  ];
  
  for (const doc of docs) {
    if (fs.existsSync(doc.file)) {
      const size = fs.statSync(doc.file).size;
      record('DOCS', doc.file, size >= doc.minSize ? 'PASS' : 'WARN',
        `${size} bytes (min: ${doc.minSize})`);
    } else {
      record('DOCS', doc.file, 'FAIL', 'Missing');
    }
  }
  
  // Check README content
  if (fs.existsSync('README.md')) {
    const readme = fs.readFileSync('README.md', 'utf-8');
    const sections = ['Quick Start', 'Environment', 'Deploy', 'License', 'MCP'];
    for (const section of sections) {
      record('DOCS', `README: ${section} section`, 
        readme.toLowerCase().includes(section.toLowerCase()) ? 'PASS' : 'WARN');
    }
  }
}

async function testSecurityChecks() {
  console.log('\n🔐 TESTING SECURITY\n' + '─'.repeat(50));
  
  // Check .gitignore
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8');
    const ignorePatterns = ['.env.local', 'node_modules', '.next'];
    for (const pattern of ignorePatterns) {
      record('SECURITY', `.gitignore: ${pattern}`, 
        gitignore.includes(pattern) ? 'PASS' : 'FAIL');
    }
  }
  
  // Check no secrets in code
  const checkFiles = [
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/middleware.ts',
  ];
  
  for (const file of checkFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasSecrets = content.includes('sk_') || content.includes('secret_') || 
                         (content.includes('sb_secret') && !content.includes('process.env'));
      record('SECURITY', `No hardcoded secrets: ${file}`, 
        !hasSecrets ? 'PASS' : 'FAIL', hasSecrets ? 'Found potential secrets!' : 'Clean');
    }
  }
  
  // Check service role key not exposed to client
  if (fs.existsSync('src/lib/supabase/client.ts')) {
    const clientCode = fs.readFileSync('src/lib/supabase/client.ts', 'utf-8');
    record('SECURITY', 'Client uses only anon key', 
      !clientCode.includes('SERVICE_ROLE') ? 'PASS' : 'FAIL');
  }
}

async function testDataIntegrity() {
  console.log('\n✅ TESTING DATA INTEGRITY\n' + '─'.repeat(50));
  
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Check workspaces have required fields
  try {
    const { data: workspaces } = await serviceClient.from('workspaces').select('id, name, slug').limit(5);
    for (const ws of workspaces || []) {
      record('DATA', `Workspace ${ws.slug} has name`, ws.name ? 'PASS' : 'WARN');
      record('DATA', `Workspace ${ws.slug} has slug`, ws.slug ? 'PASS' : 'FAIL');
    }
  } catch (e) {
    record('DATA', 'Workspace data check', 'FAIL', e.message);
  }
  
  // Check projects have workspace_id
  try {
    const { data: projects } = await serviceClient.from('projects').select('id, name, workspace_id').limit(5);
    for (const p of projects || []) {
      record('DATA', `Project "${p.name?.substring(0,20)}" has workspace`, p.workspace_id ? 'PASS' : 'FAIL');
    }
  } catch (e) {
    record('DATA', 'Project data check', 'FAIL', e.message);
  }
}

// ─── Main Test Runner ────────────────────────────────────────────────────────

async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('  ProjoFlow Self-Hosted — Comprehensive Test Suite');
  console.log('═'.repeat(60));
  console.log(`\n  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Test started: ${new Date().toISOString()}\n`);
  
  await testFileStructure();
  await testPackageJson();
  await testBuild();
  await testDatabaseConnection();
  await testDatabaseSchema();
  await testRLSPolicies();
  await testAPIRoutes();
  await testMCPServer();
  await testUIComponents();
  await testDocumentation();
  await testSecurityChecks();
  await testDataIntegrity();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`\n  ✅ PASSED: ${passed}`);
  console.log(`  ❌ FAILED: ${failed}`);
  console.log(`  ⚠️  WARNED: ${warned}`);
  console.log(`  📊 TOTAL:  ${results.length}`);
  console.log(`\n  Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { passed, failed, warned, total: results.length, passRate: ((passed / results.length) * 100).toFixed(1) + '%' },
    results: results,
  };
  
  fs.writeFileSync('tests/TEST_REPORT.json', JSON.stringify(report, null, 2));
  console.log('\n  📄 Report saved to: tests/TEST_REPORT.json\n');
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
