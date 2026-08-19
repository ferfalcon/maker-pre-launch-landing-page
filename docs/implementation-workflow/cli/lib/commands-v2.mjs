import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { renderArtifactFile } from './artifact-renderer.mjs';
import {
  addArtifactCandidate, commandFailure, date, loadRecord, optionString, recordPathFor,
  writeNewNarratives,
} from './command-support.mjs';
import { commandArtifact } from './commands/artifact.mjs';
import { commandReview } from './commands/review.mjs';
import { commandSnapshot } from './commands/snapshot.mjs';
import {
  commandArchitecture, commandMode, commandProfile, commandStage,
} from './commands/stage.mjs';
import { commandTask } from './commands/task.mjs';
import { commandTrace } from './commands/trace.mjs';
import { syncGeneratedState } from './generated-state.mjs';
import { migrateRecordV1, migrationSummary } from './migrate-record.mjs';
import { commitRecordCandidate, readStoredRecord } from './record-store.mjs';
import {
  fail, gitCommit, normalizeChoice, parseArgs, printFindings, relativeDisplay, write,
} from './utils.mjs';
import { deriveNextAction } from './workflow-actions.mjs';
import { workflowDiagnostics } from './workflow-diagnostics.mjs';
import {
  MODES, PROFILES, STAGES, artifactTypesForStage,
} from './workflow-model.mjs';
import { validateWorkflowRecord } from './workflow-record-validation.mjs';

export {
  commandArchitecture, commandArtifact, commandMode, commandProfile, commandReview,
  commandSnapshot, commandStage, commandTask, commandTrace,
};

export function commandHelp(stdout) {
  write(stdout, `Design Workflow CLI

Usage:
  design-workflow init --name <name> [--profile Express|Lite|Standard|Full] [--control cli-managed|markdown-only]
  design-workflow migrate [--check]
  design-workflow status [--json]
  design-workflow next
  design-workflow stage review --result <result> --evidence <text> [--approved-by <actor>]
  design-workflow stage advance
  design-workflow stage rewind <stage> --reason <text>
  design-workflow architecture decide <required|not-required> --reason <text>
  design-workflow profile upgrade start <profile> --resume-stage <stage> --reason <text>
  design-workflow profile upgrade finish --evidence <text> [--approved-by <actor>]
  design-workflow snapshot add|verify|supersede ...
  design-workflow artifact adopt|scaffold|review|approve|reopen|supersede|baseline ...
  design-workflow trace define|update|supersede|show ...
  design-workflow task create|ready|start|block|unblock|complete ...
  design-workflow task validation set <task-id> ...
  design-workflow review set-result <result> --artifact <id> --output <snapshot> --evidence <text> --approved-by <actor>
  design-workflow mode set <mode>
  design-workflow sync [--check]
  design-workflow validate

Schema-v1 records remain readable, but mutation requires an explicit migration.`);
}

export function commandInit(cwd, stdout, stderr, options) {
  try {
    const profile = normalizeChoice(options.profile ?? 'Lite', PROFILES);
    if (!profile) throw new Error(`Unknown profile. Choose: ${PROFILES.join(', ')}`);
    const executionMode = normalizeChoice(options.mode ?? 'Gated', MODES);
    if (!executionMode) throw new Error(`Unknown execution mode. Choose: ${MODES.join(', ')}`);
    if (executionMode === 'Task-by-task') {
      throw new Error('Task-by-task mode cannot begin before Stage 9.');
    }
    const control = normalizeChoice(
      options.control ?? 'cli-managed',
      ['cli-managed', 'markdown-only'],
    );
    if (!control) throw new Error('Unknown control mode. Choose: cli-managed, markdown-only');
    const name = optionString(options, 'name')
      ?? cwd.split(/[\\/]/).filter(Boolean).at(-1)
      ?? 'Design implementation project';
    const types = artifactTypesForStage(profile, 0);

    if (control === 'markdown-only') {
      const changes = new Map();
      for (const type of types) {
        const rendered = renderArtifactFile(cwd, type, {
          control,
          project: name,
          profile,
          mode: executionMode,
          date: date(),
        });
        changes.set(rendered.path, rendered.content);
      }
      const files = writeNewNarratives(changes);
      write(stdout, `Initialized Markdown-only ${profile} workflow: ${name}`);
      files.forEach((path) => write(stdout, `- ${relativeDisplay(cwd, path)}`));
      write(stdout, 'Markdown-only control is scaffolded but not executable; use "artifact scaffold --control markdown-only" for later stages.');
      return 0;
    }

    const recordPath = recordPathFor(cwd, options);
    if (existsSync(recordPath)) {
      throw new Error(`Workflow record already exists at ${recordPath}.`);
    }
    const record = {
      schemaVersion: 2,
      project: { name, profile, executionMode },
      state: {
        stage: 0,
        status: 'In progress',
        activeInputs: [],
        currentTask: null,
        latestOutput: null,
        latestValidationRuntime: null,
        architectureDecision: null,
      },
      snapshots: [],
      verifications: [],
      artifacts: [],
      traceItems: [],
      gates: [],
      tasks: [],
      profileTransitions: [],
      implementationReviews: [],
    };
    if (optionString(options, 'design')) {
      record.snapshots.push({
        id: 'SRC-DS-001',
        role: 'Input baseline',
        pinStrength: 'Time-bound',
        status: 'Unverified',
        reference: optionString(options, 'design'),
      });
      record.state.activeInputs.push('SRC-DS-001');
    }
    if (optionString(options, 'repository')) {
      const repository = isAbsolute(options.repository)
        ? options.repository
        : resolve(cwd, options.repository);
      const commit = gitCommit(repository);
      if (!commit) throw new Error(`Could not resolve a Git commit from ${repository}`);
      record.snapshots.push({
        id: 'SRC-REPO-001',
        role: 'Input baseline',
        pinStrength: 'Immutable',
        status: 'Unverified',
        reference: repository,
        commit,
      });
      record.state.activeInputs.push('SRC-REPO-001');
    }
    const fileChanges = new Map();
    for (const type of types) addArtifactCandidate(cwd, record, type, fileChanges);
    const committed = commitRecordCandidate({
      recordPath,
      candidate: record,
      fileChanges,
      allowCreate: true,
    });
    write(stdout, `Initialized ${profile} workflow: ${name}`);
    write(stdout, `Record: ${relativeDisplay(cwd, recordPath)}`);
    write(stdout, `Scaffolded Stage 0 artifact(s): ${types.join(', ')}`);
    write(stdout, `Updated ${committed.files.length} transactional file(s).`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandMigrate(cwd, stdout, stderr, options) {
  try {
    const path = recordPathFor(cwd, options);
    const { record } = readStoredRecord(path);
    if (record.schemaVersion === 2) {
      write(stdout, 'Record already uses schema v2; no changes required.');
      return 0;
    }
    const legacyFindings = validateWorkflowRecord(record);
    if (legacyFindings.length > 0) {
      throw new Error(`Schema-v1 record is invalid:\n${legacyFindings.map((item) => `- ${item}`).join('\n')}`);
    }
    const candidate = migrateRecordV1(record);
    const summary = migrationSummary(record, candidate);
    const candidateFindings = validateWorkflowRecord(candidate);
    if (candidateFindings.length > 0) {
      throw new Error(`Migrated candidate is invalid:\n${candidateFindings.map((item) => `- ${item}`).join('\n')}`);
    }
    if (options.check) {
      write(stdout, 'Migration check: changes required');
      summary.forEach((item) => write(stdout, `- ${item}`));
      return 1;
    }
    commitRecordCandidate({ recordPath: path, currentRecord: record, candidate });
    write(stdout, 'Migration complete.');
    summary.forEach((item) => write(stdout, `- ${item}`));
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandStatus(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const diagnostics = workflowDiagnostics(path, record);
    if (options.json) {
      write(stdout, JSON.stringify({
        record: relativeDisplay(cwd, path),
        project: record.project,
        state: record.state,
        schemaVersion: record.schemaVersion,
        readOnly: record.schemaVersion === 1,
        counts: {
          snapshots: record.snapshots.length,
          verifications: record.verifications?.length ?? 0,
          artifacts: record.artifacts.length,
          traceItems: record.traceItems?.length ?? 0,
          gates: record.gates?.length ?? 0,
          tasks: record.tasks.length,
          completeTasks: record.tasks.filter((task) => task.status === 'Complete').length,
        },
        generatedViewsCurrent: diagnostics.generatedViewsCurrent,
        subjectIntegrityCurrent: diagnostics.subjectIntegrityCurrent,
        valid: diagnostics.valid,
        findings: diagnostics.findings,
      }, null, 2));
      return diagnostics.valid ? 0 : 1;
    }
    write(stdout, record.project.name);
    write(stdout, `Schema: v${record.schemaVersion}${record.schemaVersion === 1 ? ' (read-only)' : ''}`);
    write(stdout, `Profile: ${record.project.profile}`);
    write(stdout, `Mode: ${record.project.executionMode}`);
    write(stdout, `Stage: ${record.state.stage} — ${STAGES[record.state.stage]}`);
    write(stdout, `Status: ${record.state.status}`);
    write(stdout, `Next action: ${deriveNextAction(record)}`);
    printFindings(stdout, diagnostics.findings);
    return diagnostics.valid ? 0 : 1;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandNext(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const diagnostics = workflowDiagnostics(path, record);
    if (diagnostics.findings.length > 0) {
      throw new Error(`Resolve workflow findings before advancing:\n${diagnostics.findings.map((item) => `- ${item}`).join('\n')}`);
    }
    write(stdout, `Next action: ${deriveNextAction(record)}`);
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandSync(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const result = syncGeneratedState(path, record, { check: Boolean(options.check) });
    if (options.check && !result.current) {
      write(stderr, 'Generated workflow views are missing or stale:');
      result.stale.forEach((item) => write(stderr, `- ${relativeDisplay(cwd, item)}`));
      return 1;
    }
    if (options.check) {
      write(stdout, 'Generated workflow views are current.');
    } else {
      write(
        stdout,
        result.updated.length
          ? `Updated ${result.updated.length} generated workflow view(s).`
          : 'Generated workflow views were already current.',
      );
    }
    return 0;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export function commandValidate(cwd, stdout, stderr, options) {
  try {
    const { path, record } = loadRecord(cwd, options);
    const diagnostics = workflowDiagnostics(path, record);
    printFindings(stdout, diagnostics.findings);
    return diagnostics.valid ? 0 : 1;
  } catch (error) {
    return commandFailure(stderr, error);
  }
}

export async function runWorkflowCli(args, environment) {
  const { cwd, stdout, stderr } = environment;
  const { positionals, options } = parseArgs(args);
  const command = positionals[0];
  if (!command || command === 'help' || options.help) {
    commandHelp(stdout);
    return 0;
  }
  if (command === 'init') return commandInit(cwd, stdout, stderr, options);
  if (command === 'migrate') return commandMigrate(cwd, stdout, stderr, options);
  if (command === 'status') return commandStatus(cwd, stdout, stderr, options);
  if (command === 'next') return commandNext(cwd, stdout, stderr, options);
  if (command === 'stage') return commandStage(cwd, stdout, stderr, positionals, options);
  if (command === 'architecture') {
    return commandArchitecture(cwd, stdout, stderr, positionals, options);
  }
  if (command === 'profile') return commandProfile(cwd, stdout, stderr, positionals, options);
  if (command === 'mode') return commandMode(cwd, stdout, stderr, positionals, options);
  if (command === 'snapshot') return commandSnapshot(cwd, stdout, stderr, positionals, options);
  if (command === 'artifact') return commandArtifact(cwd, stdout, stderr, positionals, options);
  if (command === 'trace') return commandTrace(cwd, stdout, stderr, positionals, options);
  if (command === 'task') return commandTask(cwd, stdout, stderr, positionals, options);
  if (command === 'review') return commandReview(cwd, stdout, stderr, positionals, options);
  if (command === 'sync') return commandSync(cwd, stdout, stderr, options);
  if (command === 'validate') return commandValidate(cwd, stdout, stderr, options);
  return fail(stderr, `Unknown command: ${command}. Run "design-workflow help".`);
}
