#!/usr/bin/env node

// Simple script to test i18n configuration
const fs = require('fs');
const path = require('path');

console.log('🌍 Verificando configuração i18n...\n');

// Check if all language files exist
const languages = ['en', 'es', 'pt', 'fr', 'de', 'zh-CN', 'ja', 'ru'];
const localesDir = path.join(__dirname, 'src/locales');

let missingFiles = 0;
let filesFound = 0;

languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'common.json');
  
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`✅ ${lang.padEnd(7)} - ${Object.keys(content).length} seções de tradução`);
      filesFound++;
    } catch (e) {
      console.log(`❌ ${lang.padEnd(7)} - Erro ao parsear JSON`);
      missingFiles++;
    }
  } else {
    console.log(`❌ ${lang.padEnd(7)} - Arquivo não encontrado`);
    missingFiles++;
  }
});

// Check if i18n config file exists
const configPath = path.join(__dirname, 'src/i18n/config.js');
if (fs.existsSync(configPath)) {
  console.log(`\n✅ Arquivo de configuração i18n encontrado`);
} else {
  console.log(`\n❌ Arquivo de configuração i18n não encontrado`);
  missingFiles++;
}

// Check if index.js imports i18n
const indexPath = path.join(__dirname, 'src/index.js');
const indexContent = fs.readFileSync(indexPath, 'utf-8');
if (indexContent.includes("import './i18n/config'")) {
  console.log(`✅ index.js importa configuração i18n`);
} else {
  console.log(`❌ index.js não importa configuração i18n`);
  missingFiles++;
}

console.log(`\n🎯 Resumo: ${filesFound}/${languages.length} idiomas configurados`);
if (missingFiles === 0) {
  console.log('✅ Configuração i18n completa!');
  process.exit(0);
} else {
  console.log(`⚠️  ${missingFiles} problema(s) encontrado(s)`);
  process.exit(1);
}
