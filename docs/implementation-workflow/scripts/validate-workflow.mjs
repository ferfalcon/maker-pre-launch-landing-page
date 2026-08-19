#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatedStateFindings } from '../cli/lib/generated-state.mjs';
import { isPathWithin } from './lib/path-safety.mjs';
import { validateWorkflowRecord } from './lib/validate-workflow-record.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, '..');

const requiredPaths = [
  'README.md',
  'QUICKSTART.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'AGENTS-instructions.md',
  'AGENTS-PROMPT-Figma-file-preparation.md',
  'AI-project-settings.md',
  'package.json',
  'workflow/Design-Implementation-Workflow.md',
  'workflow/Workflow-Profiles.md',
  'workflow/Source-Authority.md',
  'workflow/Source-Snapshots.md',
  'workflow/State-Ownership.md',
  'workflow/Agent-Orchestration.md',
  'workflow/Identifier-Conventions.md',
  'workflow/Validation-Rules.md',
  'source-adapters/FIGMA.md',
  'source-adapters/FIGMA-PREPARATION.md',
  'source-adapters/SCREENSHOTS.md',
  'source-adapters/PDF.md',
  'source-adapters/EXISTING-WEBSITE.md',
  'source-adapters/MIXED-SOURCES.md',
  'guidelines/REQUIREMENTS.md',
  'guidelines/DESIGN.md',
  'guidelines/SPEC.md',
  'guidelines/ARCHITECTURE.md',
  'guidelines/PLAN.md',
  'templates/WORKPACK.template.md',
  'templates/SOURCE-BASELINE.template.md',
  'templates/PROJECT-CONTEXT.template.md',
  'templates/WORKFLOW-STATE.template.md',
  'templates/DESIGN-AUDIT.template.md',
  'templates/IMPLEMENTATION-BRIEF.template.md',
  'templates/REQUIREMENTS.template.md',
  'templates/DESIGN.template.md',
  'templates/SPEC.template.md',
  'templates/DOCUMENT-REVIEW.template.md',
  'templates/ARCHITECTURE.template.md',
  'templates/PLAN.template.md',
  'templates/PLAN-REVIEW.template.md',
  'templates/TASKS-INDEX.template.md',
  'templates/TASK.template.md',
  'templates/IMPLEMENTATION-REVIEW.template.md',
  'prompts/00-express-workpack.md',
  'examples/express-component/README.md',
  'examples/express-component/WORKPACK.md',
  'examples/lite-component/README.md',
  'examples/standard-site/README.md',
  'examples/standard-site/ARCHITECTURE-component-example.md',
  'examples/full-application/README.md',
  'examples/full-application/ARCHITECTURE-full-stack-example.md',
  'schemas/README.md',
  'schemas/workflow-record.schema.json',
  'schemas/workflow-record.v1.schema.json',
  'cli/lib/workflow-model.mjs',
  'cli/lib/workflow-schema.mjs',
  'cli/lib/record-store.mjs',
  'cli/lib/repository-binding.mjs',
  'cli/lib/artifact-renderer.mjs',
  'cli/lib/migrate-record.mjs',
  'cli/lib/commands-v2.mjs',
  'scripts/generate-workflow-schema.mjs',
  'scripts/run-validation-suite.mjs',
  'scripts/lib/path-safety.mjs',
  'scripts/test-validation-runner.mjs',
  'scripts/test-path-safety.mjs',
  'scripts/test-entrypoint-authority.mjs',
  'scripts/test-package-manifest.mjs',
  'scripts/test-artifact-renderer.mjs',
  'scripts/test-repository-portability.mjs',
  'tests/fixtures/workflow-record.migration.v1.json',
  'tests/fixtures/workflow-record.migration.v2.json',
  'cli/README.md',
  'cli/design-workflow.mjs',
  'cli/lib/generated-state.mjs',
  'scripts/lib/validate-workflow-record.mjs',
  'scripts/test-workflow-record.mjs',
  'scripts/test-stage-gates.mjs',
  'scripts/test-cli.mjs',
  'scripts/test-generated-state.mjs',
  'tests/fixtures/workflow-record.valid.json',
  'tests/fixtures/workflow-record.express.valid.json',
  'tests/fixtures/workflow-record.invalid.json',
  'scripts/validate-workflow.mjs',
];

const promptPaths = [
  'prompts/00-intake.md',
  'prompts/01-audit.md',
  'prompts/02-requirements.md',
  'prompts/03-design.md',
  'prompts/04-specification.md',
  'prompts/05-document-review.md',
  'prompts/06-architecture.md',
  'prompts/07-plan.md',
  'prompts/08-plan-review.md',
  'prompts/09-task-decomposition.md',
  'prompts/10-implement-task.md',
  'prompts/11-implementation-review.md',
];

const legacyRootPaths = [
  'Design-Implementation-Workflow.md',
  'Workflow-Profiles.md',
  'Source-Snapshots.md',
  'Identifier-Conventions.md',
  'Figma-file-preparation.md',
  'Document-Guidelines-REQUIREMENTS.md',
  'Document-Guidelines-DESIGN.md',
  'Document-Guidelines-SPEC.md',
  'Document-Guidelines-ARCHITECTURE.md',
  'Document-Guidelines-PLAN.md',
  'examples/ARCHITECTURE-component-example.md',
  'examples/ARCHITECTURE-full-stack-example.md',
];

const errors = [];
const warnings = [];

function toRepositoryPath(path) {
  return relative(root, path).split('\\').join('/');
}

function walk(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;

    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }

  return files;
}

function stripCodeFences(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '');
}

function normalizeLinkTarget(rawTarget) {
  let target = rawTarget.trim();

  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1);
  }

  const titleSeparator = target.match(/\s+["']/);
  if (titleSeparator?.index !== undefined) {
    target = target.slice(0, titleSeparator.index);
  }

  try {
    target = decodeURIComponent(target);
  } catch {
    // Keep the original target and report resolution failures below.
  }

  return target.split('#')[0].split('?')[0];
}

function isExternalOrVirtual(target) {
  return (
    target.length === 0 ||
    target.startsWith('#') ||
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:') ||
    target.startsWith('tel:') ||
    target.startsWith('data:') ||
    target.includes('<') ||
    target.includes('>')
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function levelTwoSection(markdown, heading) {
  const marker = `## ${heading}`;
  const headingIndex = markdown.indexOf(marker);
  if (headingIndex === -1) return null;

  const contentStart = markdown.indexOf('\n', headingIndex);
  if (contentStart === -1) return '';

  const nextHeading = markdown.indexOf('\n## ', contentStart + 1);
  return markdown.slice(contentStart + 1, nextHeading === -1 ? markdown.length : nextHeading);
}

for (const repositoryPath of [...requiredPaths, ...promptPaths]) {
  if (!existsSync(join(root, repositoryPath))) {
    errors.push(`Missing required path: ${repositoryPath}`);
  }
}

for (const repositoryPath of legacyRootPaths) {
  if (existsSync(join(root, repositoryPath))) {
    errors.push(`Legacy path still exists: ${repositoryPath}`);
  }
}

const packagePath = join(root, 'package.json');
const changelogPath = join(root, 'CHANGELOG.md');
if (existsSync(packagePath) && existsSync(changelogPath)) {
  try {
    const packageMetadata = JSON.parse(readFileSync(packagePath, 'utf8'));
    const version = packageMetadata.version;
    if (typeof version !== 'string' || version.length === 0) {
      errors.push('package.json: expected a non-empty version string');
    } else {
      const changelog = readFileSync(changelogPath, 'utf8');
      const releaseHeading = new RegExp(`^## \\[${escapeRegExp(version)}\\] — \\d{4}-\\d{2}-\\d{2}\\s*$`, 'm');
      if (!releaseHeading.test(changelog)) {
        errors.push(`CHANGELOG.md: package version ${version} requires a dated release heading`);
      }
    }
  } catch (error) {
    errors.push(`package.json: invalid JSON: ${error.message}`);
  }
}

const readmePath = join(root, 'README.md');
if (existsSync(readmePath)) {
  const readme = readFileSync(readmePath, 'utf8');
  const entryPoints = levelTwoSection(readme, 'Choose your entry point');
  if (entryPoints === null) {
    errors.push('README.md: missing Choose your entry point section');
  } else if (!entryPoints.includes('](AGENTS-instructions.md)')) {
    errors.push('README.md: Choose your entry point must link AGENTS-instructions.md');
  }
  if (!readme.includes('](workflow/Agent-Orchestration.md)')) {
    errors.push('README.md: must keep workflow/Agent-Orchestration.md discoverable');
  }
}

const allFiles = walk(root);
const markdownFiles = allFiles.filter((path) => extname(path).toLowerCase() === '.md');
const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;

for (const markdownPath of markdownFiles) {
  const repositoryPath = toRepositoryPath(markdownPath);
  const markdown = stripCodeFences(readFileSync(markdownPath, 'utf8'));
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const rawTarget = match[1];
    const target = normalizeLinkTarget(rawTarget);

    if (isExternalOrVirtual(target)) continue;

    const resolvedTarget = resolve(dirname(markdownPath), target);

    if (!isPathWithin(root, resolvedTarget)) {
      errors.push(`${repositoryPath}: link escapes repository: ${rawTarget}`);
      continue;
    }

    if (!existsSync(resolvedTarget)) {
      errors.push(`${repositoryPath}: broken relative link: ${rawTarget}`);
    }
  }
}

for (const promptPath of promptPaths) {
  const absolutePath = join(root, promptPath);
  if (!existsSync(absolutePath)) continue;

  const content = readFileSync(absolutePath, 'utf8');
  if (!/^# Stage \d+|^# Stage 0/m.test(content)) {
    warnings.push(`${promptPath}: expected a Stage heading`);
  }
}

const templateFiles = readdirSync(join(root, 'templates'))
  .filter((name) => name.endsWith('.template.md'))
  .sort();

if (templateFiles.length < 15) {
  errors.push(`Expected at least 15 templates, found ${templateFiles.length}`);
}

for (const name of templateFiles) {
  const repositoryPath = `templates/${name}`;
  const content = readFileSync(join(root, repositoryPath), 'utf8');
  const count = (marker) => content.split(marker).length - 1;
  const artifactStart = '<!-- artifact:start -->';
  const artifactEnd = '<!-- artifact:end -->';
  if (count(artifactStart) !== 1 || count(artifactEnd) !== 1 || content.indexOf(artifactStart) > content.indexOf(artifactEnd)) {
    errors.push(`${repositoryPath}: expected one well-ordered artifact marker pair`);
  }
  for (const control of ['cli-managed', 'markdown-only']) {
    const start = `<!-- control:${control}:start -->`;
    const end = `<!-- control:${control}:end -->`;
    if (count(start) === 0 || count(start) !== count(end)) {
      errors.push(`${repositoryPath}: expected balanced ${control} control marker pairs`);
    }
  }
}

const canonicalContentRoots = ['templates/', 'examples/', 'workflow/', 'guidelines/', 'prompts/', 'source-adapters/'];
const deprecatedContracts = [
  [/REQ-FUNC-/g, 'REQ-FUNC-*'],
  [/REQ-QUAL-/g, 'REQ-QUAL-*'],
  [/SPEC-BEHAVIOR-/g, 'SPEC-BEHAVIOR-*'],
  [/\bSPEC-[0-9]{3,}\b/g, 'unqualified SPEC-*'],
  [/ChatGPT-instructions\.md/g, 'ChatGPT-instructions.md'],
];
for (const path of allFiles) {
  const repositoryPath = toRepositoryPath(path);
  if (!canonicalContentRoots.some((prefix) => repositoryPath.startsWith(prefix))) continue;
  if (!['.md', '.json'].includes(extname(path).toLowerCase())) continue;
  const content = readFileSync(path, 'utf8');
  for (const [pattern, label] of deprecatedContracts) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) errors.push(`${repositoryPath}: deprecated contract reference ${label}`);
  }
}

for (const jsonPath of [
  join(root, 'schemas', 'workflow-record.schema.json'),
  join(root, 'tests', 'fixtures', 'workflow-record.valid.json'),
  join(root, 'schemas', 'workflow-record.v1.schema.json'),
  join(root, 'tests', 'fixtures', 'workflow-record.migration.v1.json'),
  join(root, 'tests', 'fixtures', 'workflow-record.migration.v2.json'),
  join(root, 'tests', 'fixtures', 'workflow-record.express.valid.json'),
  join(root, 'tests', 'fixtures', 'workflow-record.invalid.json'),
]) {
  try {
    JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    errors.push(`${toRepositoryPath(jsonPath)}: invalid JSON: ${error.message}`);
  }
}

const workflowRecordFiles = allFiles.filter((path) => {
  const repositoryPath = toRepositoryPath(path);
  if (repositoryPath.startsWith('tests/fixtures/')) return false;
  return repositoryPath.endsWith('/workflow-record.json') || repositoryPath.endsWith('.workflow.json');
});

for (const recordPath of workflowRecordFiles) {
  const repositoryPath = toRepositoryPath(recordPath);
  let record;
  try {
    record = JSON.parse(readFileSync(recordPath, 'utf8'));
  } catch (error) {
    errors.push(`${repositoryPath}: invalid JSON: ${error.message}`);
    continue;
  }

  for (const finding of [
    ...validateWorkflowRecord(record),
    ...generatedStateFindings(recordPath, record),
  ]) {
    errors.push(`${repositoryPath}: ${finding}`);
  }
}

if (warnings.length > 0) {
  console.warn('Warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
  console.warn('');
}

if (errors.length > 0) {
  console.error('Workflow repository validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Workflow repository validation passed.');
  console.log(`Checked ${requiredPaths.length + promptPaths.length} required paths, ${markdownFiles.length} Markdown files, and ${workflowRecordFiles.length} project workflow record(s).`);
}
