#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const PUBLIC_CATEGORIES = ['engineering', 'productivity', 'misc'];
const EXCLUDED_CATEGORIES = ['in-progress', 'deprecated'];

function getSkillDirs(category) {
  const categoryPath = join(ROOT, 'skills', category);
  if (!existsSync(categoryPath)) return [];
  return readdirSync(categoryPath, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(categoryPath, d.name, 'SKILL.md')))
    .map(d => d.name);
}

const pluginJson = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
const registeredSkills = new Set(pluginJson.skills);
const rootReadme = readFileSync(join(ROOT, 'README.md'), 'utf8');

const errors = [];

for (const category of PUBLIC_CATEGORIES) {
  for (const skill of getSkillDirs(category)) {
    const pluginPath = `./skills/${category}/${skill}`;
    if (!registeredSkills.has(pluginPath)) {
      errors.push(`Missing from .claude-plugin/plugin.json: ${pluginPath}`);
    }
    if (!rootReadme.includes(`skills/${category}/${skill}`)) {
      errors.push(`Missing from README.md: skills/${category}/${skill}`);
    }
  }
}

for (const category of EXCLUDED_CATEGORIES) {
  for (const skill of getSkillDirs(category)) {
    const pluginPath = `./skills/${category}/${skill}`;
    if (registeredSkills.has(pluginPath)) {
      errors.push(`Must not appear in plugin.json: ${pluginPath}`);
    }
    if (rootReadme.includes(`skills/${category}/${skill}`)) {
      errors.push(`Must not appear in README.md: skills/${category}/${skill}`);
    }
  }
}

for (const skillPath of registeredSkills) {
  if (!existsSync(join(ROOT, skillPath, 'SKILL.md'))) {
    errors.push(`plugin.json references missing skill: ${skillPath}`);
  }
}

if (errors.length > 0) {
  console.error('Skill validation failed:\n');
  errors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
} else {
  console.log('✓ All skills are valid and properly registered.');
}
