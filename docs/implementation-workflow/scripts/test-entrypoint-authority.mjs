#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

const readme = read('README.md');
const quickstart = read('QUICKSTART.md');
const projectSettings = read('AI-project-settings.md');
const toolkitAgents = read('AGENTS.md');
const consumerAgents = read('AGENTS-instructions.md');
const figmaLauncher = read('AGENTS-PROMPT-Figma-file-preparation.md');
const errors = [];

const requiredReadmeLinks = [
  'QUICKSTART.md',
  'workflow/Design-Implementation-Workflow.md',
  'AGENTS-instructions.md',
  'AI-project-settings.md',
  'AGENTS-PROMPT-Figma-file-preparation.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'cli/README.md',
  'schemas/README.md',
];

if (!readme.includes('## Choose your entry point')) {
  errors.push('README must route users through a role-based "Choose your entry point" section.');
}

for (const target of requiredReadmeLinks) {
  if (!readme.includes(`](${target})`)) {
    errors.push(`README entry-point discovery is missing ${target}.`);
  }
}

if (!readme.includes('choose a profile before initialization')) {
  errors.push('README implementation-project entry point must route through profile selection before initialization.');
}

const delegatedReadmeHeadings = [
  'Source snapshots',
  'Workflow profiles',
  'Execution modes',
  'Ownership summary',
  'Integrated quality',
  'Two-pass reviews',
];

for (const heading of delegatedReadmeHeadings) {
  if (new RegExp(`^##\\s+${heading}$`, 'im').test(readme)) {
    errors.push(`README must link to the canonical owner instead of redefining a "${heading}" handbook section.`);
  }
}

if (/design-workflow\s+agent-context\s+--json/i.test(readme)) {
  errors.push('README must not become the consumer-agent bootstrap; delegate agent-context protocol to AGENTS-instructions.md.');
}

const profileSelectionHeading = '## 1. Choose a profile before initialization';
const expressExampleHeading = '## Express worked example';
const profileSelectionIndex = quickstart.indexOf(profileSelectionHeading);
const expressExampleIndex = quickstart.indexOf(expressExampleHeading);

if (!quickstart.startsWith('# Quickstart: Choose a Workflow Profile and Start')) {
  errors.push('QUICKSTART must begin with profile selection rather than presenting Express as the default workflow.');
}

if (profileSelectionIndex === -1) {
  errors.push('QUICKSTART must make profile selection the first numbered decision.');
}

if (!quickstart.includes('](workflow/Workflow-Profiles.md)')) {
  errors.push('QUICKSTART must delegate canonical profile rules to workflow/Workflow-Profiles.md.');
}

if (expressExampleIndex === -1) {
  errors.push('QUICKSTART must preserve Express as an explicitly labeled worked example.');
} else if (profileSelectionIndex === -1 || expressExampleIndex <= profileSelectionIndex) {
  errors.push('QUICKSTART profile selection must appear before the Express worked example.');
}

const quickstartRouting = expressExampleIndex === -1 ? quickstart : quickstart.slice(0, expressExampleIndex);
for (const profile of ['Express', 'Lite', 'Standard', 'Full']) {
  if (!quickstartRouting.includes(`**${profile}**`)) {
    errors.push(`QUICKSTART profile-selection routing must include ${profile}.`);
  }
}

if (!quickstartRouting.includes('--profile "<selected-profile>"')) {
  errors.push('QUICKSTART initialization must use the selected profile instead of hard-coding Express.');
}

if (/--profile\s+Express/.test(quickstartRouting)) {
  errors.push('QUICKSTART must not hard-code Express before the reader has selected a profile.');
}

if (!projectSettings.includes('docs/implementation-workflow/AGENTS-instructions.md')) {
  errors.push('ChatGPT Project settings must delegate workflow execution to the vendored consumer-agent bootstrap.');
}

if (!projectSettings.includes("These Project instructions define ChatGPT's environment, tool behavior, autonomy, and execution posture.")) {
  errors.push('ChatGPT Project settings must keep their host/tool boundary explicit.');
}

if (/workflow\/Agent-Orchestration\.md/.test(projectSettings)) {
  errors.push('ChatGPT Project settings must route through AGENTS-instructions.md rather than bypassing the consumer bootstrap.');
}

if (!toolkitAgents.includes('# Repository Guidelines')) {
  errors.push('AGENTS.md must remain the toolkit repository-development contract.');
}

if (!consumerAgents.includes('# Agent bootstrap contract')) {
  errors.push('AGENTS-instructions.md must remain the implementation-project consumer bootstrap.');
}

if (!figmaLauncher.includes('single normative procedure')) {
  errors.push('Figma preparation launcher must identify one canonical preparation owner.');
}

if (errors.length > 0) {
  console.error('Entrypoint authority test failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Entrypoint authority test passed (root entry points remain role-specific and Quickstart selects a profile before examples).');
}
