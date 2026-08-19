import { existsSync } from 'node:fs';
import { runWorkflowCli } from './commands-v2.mjs';
import { mutateRecord, readStoredRecord } from './record-store.mjs';
import { bindRepositoryWorkspace } from './repository-binding.mjs';
import { buildOrchestrationContext } from './orchestration-context.mjs';
import { checkStage } from './stage-check.mjs';
import {
  bindToolkit, migrateLegacyToolkitBinding, runtimeToolkitPin,
  toolkitBindingFromRecord, withInitializationToolkitPin,
} from './toolkit-binding.mjs';
import {
  fail, normalizeTaskCreateArgs, parseArgs, relativeDisplay, write,
} from './utils.mjs';
import { normalizeRecordArgs, resolveWorkflowWorkspace } from './workspace.mjs';

function json(stdout, value) { write(stdout, JSON.stringify(value, null, 2)); }

function contextWhenMissing(cwd, recordPath) {
  return {
    protocolVersion: 1,
    initialized: false,
    control: { mode: null, schemaVersion: null, readOnly: false, record: relativeDisplay(cwd, recordPath) },
    project: { root: '.' },
    toolkit: {
      pinned: false, repository: null, revision: null,
      legacy: false, snapshot: null, ambiguous: false,
    },
    execution: {
      kind: 'initialization', prompt: 'prompts/00-intake.md', promptSource: null,
      primaryArtifactTypes: [], artifacts: [],
      sourceAdapterPolicy: 'Select the matching source adapter after the actual design source is identified.',
    },
    policy: {
      workflowMutation: 'initialize-first', implementation: 'forbidden', codeEdits: 'forbidden',
      stageDecision: 'not-applicable', generatedViews: 'not-initialized',
    },
    nextAction: 'Initialize the workflow before auditing, planning, or implementation.',
  };
}

function stringOption(options, name) {
  const value = options[name];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toolkitOverrides(options, prefix = '') {
  const key = (name) => prefix ? `${prefix}-${name}` : name;
  return {
    revision: stringOption(options, key('revision')) ?? stringOption(options, key('commit')),
    repository: stringOption(options, key('repository')),
  };
}

function toolkitSummary(binding) {
  return `${binding.repository}#${binding.revision}`;
}

export async function runCli(args, environment) {
  const { cwd, stdout, stderr } = environment;
  const parsed = parseArgs(args);
  const { positionals, options } = parsed;
  const command = positionals[0];
  const workspace = resolveWorkflowWorkspace(cwd, options.record);
  const { recordPath, projectRoot } = workspace;
  const workflowArgsBase = normalizeRecordArgs(args, recordPath);
  const workflowEnvironment = { ...environment, cwd: projectRoot };

  if (!command || command === 'help' || options.help) {
    const result = await runWorkflowCli(workflowArgsBase, workflowEnvironment);
    write(stdout, '\nTask phases:');
    write(stdout, '  design-workflow task create [--phase <0-99|P00-P99> | --id <Pxx-Txx>] ...');
    write(stdout, '  --phase and --id are mutually exclusive. Without either, numbering continues in the highest existing phase and defaults to Phase 01.');
    write(stdout, '\nAgent orchestration:');
    write(stdout, '  design-workflow context [--json]');
    write(stdout, '  design-workflow stage check [--json]');
    write(stdout, '\nWorkflow toolkit dependency:');
    write(stdout, '  design-workflow toolkit show [--json]');
    write(stdout, '  design-workflow toolkit pin --revision <40-character-sha> [--repository owner/name]');
    write(stdout, '  design-workflow toolkit migrate');
    write(stdout, '  --commit remains accepted as an alias for --revision.');
    write(stdout, '\nLocal repository binding:');
    write(stdout, '  design-workflow repository bind <snapshot-id> --path <checkout>');
    return result;
  }

  if (command === 'repository' && positionals[1] === 'bind') {
    try {
      const snapshotId = positionals[2];
      const repositoryPath = stringOption(options, 'path');
      if (!snapshotId || !repositoryPath) {
        return fail(stderr, 'Usage: design-workflow repository bind <snapshot-id> --path <checkout>');
      }
      const { record } = readStoredRecord(recordPath);
      const snapshot = record.snapshots.find((item) => item.id === snapshotId && item.id.startsWith('SRC-REPO-'));
      if (!snapshot) return fail(stderr, `Repository snapshot ${snapshotId} does not exist.`);
      const binding = bindRepositoryWorkspace(projectRoot, snapshot, repositoryPath);
      write(stdout, `Bound ${snapshotId} (${snapshot.reference}) to ${relativeDisplay(projectRoot, binding.repository)}.`);
      write(stdout, `Local binding: ${relativeDisplay(projectRoot, binding.path)}`);
      return 0;
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
  }

  if (command === 'toolkit' && positionals[1] === 'show') {
    try {
      const { record } = readStoredRecord(recordPath);
      const binding = toolkitBindingFromRecord(record);
      if (options.json) json(stdout, binding);
      else if (binding.pinned) {
        write(stdout, `Toolkit dependency: ${toolkitSummary(binding)}${binding.legacy ? ' (legacy snapshot)' : ''}`);
        if (binding.legacy) write(stdout, 'Run "design-workflow toolkit migrate" to move this dependency out of project source lineage.');
      } else write(stdout, 'Toolkit dependency is not pinned.');
      return binding.ambiguous || binding.invalid ? 1 : 0;
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
  }

  if (command === 'toolkit' && positionals[1] === 'pin') {
    try {
      const overrides = toolkitOverrides(options);
      if (!overrides.revision) {
        return fail(stderr, 'Usage: design-workflow toolkit pin --revision <40-character-sha> [--repository owner/name]');
      }
      const pin = runtimeToolkitPin(overrides);
      if (!pin) return fail(stderr, 'Could not resolve the workflow toolkit dependency. Supply --revision explicitly.');
      let outcome;
      mutateRecord(recordPath, (candidate) => {
        outcome = bindToolkit(candidate, pin);
      });
      if (outcome.migrated) write(stdout, `Migrated and pinned toolkit dependency: ${toolkitSummary(outcome.binding)}`);
      else write(stdout, outcome.changed
        ? `Pinned toolkit dependency: ${toolkitSummary(outcome.binding)}`
        : `Toolkit dependency already pinned: ${toolkitSummary(outcome.binding)}`);
      return 0;
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
  }

  if (command === 'toolkit' && positionals[1] === 'migrate') {
    try {
      let outcome;
      mutateRecord(recordPath, (candidate) => {
        outcome = migrateLegacyToolkitBinding(candidate);
      });
      write(stdout, outcome.migrated
        ? `Migrated toolkit dependency: ${toolkitSummary(outcome.binding)}`
        : `Toolkit dependency already uses the canonical binding: ${toolkitSummary(outcome.binding)}`);
      return 0;
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
  }

  if (command === 'context') {
    if (!existsSync(recordPath)) {
      const value = contextWhenMissing(projectRoot, recordPath);
      if (options.json) json(stdout, value); else write(stdout, value.nextAction);
      return 0;
    }
    try {
      const { record } = readStoredRecord(recordPath);
      const value = buildOrchestrationContext(recordPath, record, { cwd: projectRoot });
      if (options.json) json(stdout, value);
      else {
        write(stdout, `${value.project.name}: Stage ${value.stage.number} — ${value.stage.name}`);
        write(stdout, `Project root: ${value.project.root}`);
        write(stdout, `Execution: ${value.execution.kind}`);
        write(stdout, value.toolkit.pinned
          ? `Toolkit: ${toolkitSummary(value.toolkit)}${value.toolkit.legacy ? ' (legacy snapshot)' : ''}`
          : 'Toolkit: unpinned');
        write(stdout, `Next action: ${value.nextAction}`);
      }
      return value.workflow.valid && !value.toolkit.ambiguous && !value.toolkit.invalid ? 0 : 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (options.json) {
        json(stdout, {
          protocolVersion: 1, initialized: true, execution: { kind: 'repair' },
          workflow: { valid: false, findings: [message] }, nextAction: 'Repair the workflow record before continuing.',
        });
        return 1;
      }
      return fail(stderr, message);
    }
  }

  if (command === 'stage' && positionals[1] === 'check') {
    try {
      const { record } = readStoredRecord(recordPath);
      const value = checkStage(recordPath, record);
      if (options.json) json(stdout, value);
      else {
        write(stdout, `Stage ${value.stage.number} — ${value.stage.name}`);
        write(stdout, `Recommended decision: ${value.decision.recommendedResult ?? 'None'}`);
        write(stdout, value.advance.allowedNow ? 'Advancement is currently permitted.' : 'Advancement is not currently permitted.');
        for (const finding of value.decision.findings) write(stdout, `- ${finding}`);
      }
      return value.decision.recordable || value.advance.allowedNow ? 0 : 1;
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
  }

  if (command === 'init') {
    let pin;
    try {
      pin = runtimeToolkitPin(toolkitOverrides(options, 'toolkit'));
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
    const result = await withInitializationToolkitPin(
      pin,
      () => runWorkflowCli(workflowArgsBase, workflowEnvironment),
    );
    if (result !== 0 || options.control === 'markdown-only') return result;
    if (!pin) {
      write(stdout, 'Toolkit dependency is unpinned. Run "design-workflow toolkit pin --revision <40-character-sha>" before relying on remote workflow resources.');
      return result;
    }
    write(stdout, `Toolkit dependency: ${toolkitSummary(pin)}`);
    return result;
  }

  let workflowArgs = workflowArgsBase;
  if (command === 'task' && positionals[1] === 'create' && options.phase !== undefined) {
    try {
      const { record } = readStoredRecord(recordPath);
      workflowArgs = normalizeTaskCreateArgs(workflowArgsBase, record.tasks, parseArgs(workflowArgsBase));
    } catch (error) {
      return fail(stderr, error instanceof Error ? error.message : String(error));
    }
  }

  return runWorkflowCli(workflowArgs, workflowEnvironment);
}
