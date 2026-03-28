#!/usr/bin/env node

/**
 * Script de vérification de la terminologie Lyss
 * Vérifie que tous les termes utilisés sont conformes au guide
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Termes interdits (ancienne terminologie)
const FORBIDDEN_TERMS = [
  { pattern: /\bConfier\b/, message: 'Utiliser "Nouvelle facture" au lieu de "Confier"' },
  { pattern: /\bSoumissions\b/, message: 'Utiliser "Devis" au lieu de "Soumissions"' },
  { pattern: /\bLot\b(?!.*Traitement par lot)/, message: 'Utiliser "Traitement par lot" au lieu de "Lot"' },
  { pattern: /\bAudit\b(?!.*Journal)/, message: 'Utiliser "Journal" au lieu de "Audit"' },
  { pattern: /\bWorkflow\b/, message: 'Utiliser "Automatisation" au lieu de "Workflow"' },
  { pattern: /\bPipeline\b/, message: 'Utiliser "Flux de travail" au lieu de "Pipeline"' },
];

// Termes recommandés (vérification de cohérence)
const RECOMMENDED_TERMS = [
  { pattern: /\bNouvelle facture\b/, required: true },
  { pattern: /\bFactures en cours\b/, required: true },
  { pattern: /\bDevis\b/, required: true },
  { pattern: /\bAutomatisation\b/, required: true },
  { pattern: /\bTraitement par lot\b/, required: true },
  { pattern: /\bJournal\b/, required: true },
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    FORBIDDEN_TERMS.forEach(({ pattern, message }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          message: message,
          code: line.trim()
        });
      }
    });
  });

  return issues;
}

function checkRecommendedTerms(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Vérifier que les termes recommandés sont utilisés de manière cohérente
  // (Cette vérification est plus complexe et nécessiterait une analyse sémantique)
  
  return issues;
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = [];
  
  // Collecter tous les fichiers .tsx et .ts
  function collectFiles(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Ignorer node_modules et .git
        if (!item.name.includes('node_modules') && !item.name.includes('.git')) {
          collectFiles(fullPath);
        }
      } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  collectFiles(srcDir);
  
  console.log(`🔍 Vérification de ${files.length} fichiers...\n`);
  
  const allIssues = [];
  
  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
  }
  
  if (allIssues.length === 0) {
    console.log('✅ Tous les fichiers utilisent la terminologie correcte !');
    process.exit(0);
  } else {
    console.log(`❌ ${allIssues.length} problème(s) de terminologie trouvé(s) :\n`);
    
    // Grouper par fichier pour une meilleure lisibilité
    const issuesByFile = {};
    allIssues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });
    
    for (const [file, fileIssues] of Object.entries(issuesByFile)) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`📄 ${relativePath}:`);
      
      fileIssues.forEach(issue => {
        console.log(`   Ligne ${issue.line}: ${issue.message}`);
        console.log(`   Code: "${issue.code}"\n`);
      });
    }
    
    console.log('\n💡 Conseils :');
    console.log('1. Consultez docs/TERMINOLOGY_GUIDE.md pour la terminologie correcte');
    console.log('2. Utilisez la recherche/remplacement pour corriger les termes');
    console.log('3. Testez que les changements n\'affectent pas la fonctionnalité\n');
    
    process.exit(1);
  }
}

main();
