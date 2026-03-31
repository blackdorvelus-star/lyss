// Relevance AI Agent Synchronization Script
// Syncs local agent configs with Relevance AI

import https from 'https';
import fs from 'fs';
import { readdirSync } from 'fs';
import { join, basename } from 'path';

console.log('🔄 Relevance AI Agent Sync');
console.log('=========================');

const apiKey = process.env.RELEVANCE_API_KEY;
const projectId = process.env.RELEVANCE_PROJECT_ID || 'default';
const region = process.env.RELEVANCE_REGION;

if (!apiKey) {
  console.error('❌ RELEVANCE_API_KEY not found');
  process.exit(1);
}

// Use api.relevance.ai which at least resolves
// Region "bcbe5a" appears to be a project code, not regional endpoint
const apiHost = 'api.relevance.ai';
console.log(`🌍 Using API host: ${apiHost}`);
console.log(`📍 Region parameter: ${region || 'none'}`);

// Read all agent configs
const relevanceDir = '.relevance';
let agentFiles = [];

try {
  agentFiles = readdirSync(relevanceDir)
    .filter(file => file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml'))
    .map(file => join(relevanceDir, file));
} catch (error) {
  console.log('📁 No .relevance directory found, creating sample agents...');
  agentFiles = [];
}

if (agentFiles.length === 0) {
  console.log('📝 Creating sample agent configurations...');
  
  // Create sample agents if none exist
  const sampleAgents = [
    {
      name: 'lyss-docs-agent',
      file: 'lyss-docs-agent.json',
      config: {
        name: 'lyss-docs-agent',
        description: 'Documentation assistant for Lyss project',
        model: 'gpt-4',
        instructions: 'You are a documentation assistant for the Lyss project. Help users understand the codebase, write documentation, and answer questions about the project structure.',
        tools: ['web_search', 'code_interpreter'],
        metadata: {
          project: 'lyss',
          type: 'documentation',
          version: '1.0.0'
        }
      }
    },
    {
      name: 'lyss-tests-agent', 
      file: 'lyss-tests-agent.json',
      config: {
        name: 'lyss-tests-agent',
        description: 'Testing and QA assistant for Lyss project',
        model: 'gpt-4',
        instructions: 'You are a testing assistant for the Lyss project. Help write tests, debug issues, and ensure code quality.',
        tools: ['code_interpreter', 'file_system'],
        metadata: {
          project: 'lyss',
          type: 'testing',
          version: '1.0.0'
        }
      }
    }
  ];
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(relevanceDir)) {
    fs.mkdirSync(relevanceDir, { recursive: true });
  }
  
  // Write sample agents
  for (const agent of sampleAgents) {
    const filePath = join(relevanceDir, agent.file);
    fs.writeFileSync(filePath, JSON.stringify(agent.config, null, 2));
    agentFiles.push(filePath);
    console.log(`✅ Created: ${agent.file}`);
  }
}

console.log(`📁 Found ${agentFiles.length} agent configs:`);
agentFiles.forEach(file => console.log(`  - ${basename(file)}`));

// Function to sync a single agent
function syncAgent(agentFile) {
  return new Promise((resolve) => {
    const agentName = basename(agentFile, '.json').replace('.yml', '').replace('.yaml', '');
    let agentConfig;
    
    try {
      const fileContent = fs.readFileSync(agentFile, 'utf8');
      
      // Parse JSON or YAML
      if (agentFile.endsWith('.json')) {
        agentConfig = JSON.parse(fileContent);
      } else {
        // For YAML, we'd need a YAML parser
        console.log(`⚠️ YAML parsing not implemented for ${agentName}, using basic config`);
        agentConfig = {
          name: agentName,
          description: `Agent for ${agentName}`,
          model: 'gpt-4',
          instructions: `You are the ${agentName} for the Lyss project.`
        };
      }
    } catch (error) {
      console.log(`❌ Error reading ${agentFile}: ${error.message}`);
      resolve({ agent: agentName, success: false, error: error.message });
      return;
    }
    
    console.log(`\n🔄 Syncing: ${agentName}`);
    
    const postData = JSON.stringify({
      ...agentConfig,
      project_id: projectId
    });
    
    console.log(`   API host: ${apiHost}`);
      
      const options = {
        hostname: apiHost,
        port: 443,
        path: `/api/projects/${projectId}/agents`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Lyss-Relevance-Sync/1.0',
          'X-Project-Id': projectId
        }
      };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        // Check for HTML responses
        const isHtml = data.includes('<!doctype html>') || data.includes('<html');
        
        if (isHtml) {
          console.log(`❌ ${agentName}: Server returned HTML (authentication failed)`);
          console.log(`   Response: ${data.substring(0, 200)}`);
          resolve({ agent: agentName, success: false, error: 'authentication_failed', html: true });
          return;
        }
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${agentName} synced successfully`);
            console.log(`   ID: ${response.id || response.agent_id || 'N/A'}`);
            console.log(`   Status: ${response.status || 'active'}`);
            resolve({ agent: agentName, success: true, response });
          } else if (res.statusCode === 409) {
            // Agent already exists, try update
            console.log(`⚠️ ${agentName} already exists, trying update...`);
            updateAgent(agentName, agentConfig).then(resolve);
          } else {
            console.log(`❌ ${agentName} sync failed`);
            console.log(`   Error: ${response.error || response.message || 'Unknown error'}`);
            resolve({ agent: agentName, success: false, error: response });
          }
        } catch (e) {
          console.log(`❌ ${agentName} sync failed (parse error)`);
          console.log(`   Response: ${data.substring(0, 200)}`);
          resolve({ agent: agentName, success: false, error: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${agentName} network error: ${error.message}`);
      resolve({ agent: agentName, success: false, error: error.message });
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`❌ ${agentName} timeout after 15 seconds`);
      resolve({ agent: agentName, success: false, error: 'timeout' });
    });
    
    req.write(postData);
    req.end();
  });
}

// Function to update existing agent
function updateAgent(agentName, agentConfig) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      ...agentConfig,
      project_id: projectId
    });
    
    const options = {
      hostname: apiHost,
      port: 443,
      path: `/api/projects/${projectId}/agents/${agentName}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Lyss-Relevance-Sync/1.0',
        'X-Project-Id': projectId
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Update Status: ${res.statusCode}`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ ${agentName} updated successfully`);
            resolve({ agent: agentName, success: true, response, updated: true });
          } else {
            console.log(`❌ ${agentName} update failed`);
            console.log(`   Error: ${response.error || response.message || 'Unknown error'}`);
            resolve({ agent: agentName, success: false, error: response });
          }
        } catch (e) {
          console.log(`❌ ${agentName} update failed (parse error)`);
          console.log(`   Response: ${data.substring(0, 200)}`);
          resolve({ agent: agentName, success: false, error: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${agentName} update network error: ${error.message}`);
      resolve({ agent: agentName, success: false, error: error.message });
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`❌ ${agentName} update timeout after 15 seconds`);
      resolve({ agent: agentName, success: false, error: 'timeout' });
    });
    
    req.write(postData);
    req.end();
  });
}

// Sync all agents
async function syncAllAgents() {
  console.log('\n🚀 Starting agent synchronization...');
  
  const results = [];
  
  for (const agentFile of agentFiles) {
    const result = await syncAgent(agentFile);
    results.push(result);
    
    // Delay between syncs
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📊 Sync Summary:');
  console.log('===============');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  // List agents
  console.log('\n📋 Agents:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.agent}`);
  });
  
  if (failed === 0) {
    console.log('\n🎉 All agents synced successfully!');
    console.log('\n🔗 Next steps:');
    console.log('1. Check Relevance AI dashboard for your agents');
    console.log('2. Configure triggers and workflows');
    console.log('3. Test agent execution');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some agents failed to sync. Check logs above.');
    process.exit(1);
  }
}

// Run sync
syncAllAgents().catch(error => {
  console.error('❌ Sync runner error:', error);
  process.exit(1);
});
