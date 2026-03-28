#!/usr/bin/env node

/**
 * Script de correction automatique de la terminologie Lyss
 * Remplace les anciens termes par les nouveaux selon le guide
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mappage des termes à remplacer
const REPLACEMENTS = [
  { old: /\bConfier\b/g, new: 'Nouvelle facture' },
  { old: /\bSoumissions\b/g, new: 'Devis' },
  { old: /\bLot\b(?!.*Traitement par lot)/g, new: 'Traitement par lot' },
  { old: /\bAudit\b(?!.*Journal)/g, new: 'Journal' },
  { old: /\bWorkflow\b/g, new: 'Automatisation' },
  { old: /\bPipeline\b/g, new: 'Flux de travail' },
  // Cas spéciaux
  { old: /\bConfier un dossier\b/g, new: 'Nouvelle facture' },
  { old: /\bConfier un premier dossier\b/g, new: 'Nouvelle facture' },
  { old: /\bJournal d'audit\b/g, new: 'Journal' },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  REPLACEMENTS.forEach(({ old, new: newTerm }) => {
    const matches = content.match(old);
    if (matches) {
      changes += matches.length;
      content = content.replace(old, newTerm);
    }
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }
  
  return 0;
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
  
  console.log(`🔧 Correction de la terminologie dans ${files.length} fichiers...\n`);
  
  let totalChanges = 0;
  const changedFiles = [];
  
  for (const file of files) {
    const changes = fixFile(file);
    if (changes > 0) {
      totalChanges += changes;
      changedFiles.push({
        file: path.relative(process.cwd(), file),
        changes
      });
    }
  }
  
  if (changedFiles.length === 0) {
    console.log('✅ Aucune correction nécessaire !');
  } else {
    console.log(`✅ ${totalChanges} changement(s) effectué(s) dans ${changedFiles.length} fichier(s) :\n`);
    
    changedFiles.forEach(({ file, changes }) => {
      console.log(`   📄 ${file} (${changes} changement(s))`);
    });
    
    console.log('\n📋 Résumé des remplacements :');
    REPLACEMENTS.forEach(({ old, new: newTerm }) => {
      console.log(`   ${old.toString()} → ${newTerm}`);
    });
    
    console.log('\n⚠️  Vérifiez que les changements n\'affectent pas la fonctionnalité !');
    console.log('💡 Exécutez "npm run check:terminology" pour vérifier qu\'il ne reste plus d\'incohérences.');
  }
}

main();