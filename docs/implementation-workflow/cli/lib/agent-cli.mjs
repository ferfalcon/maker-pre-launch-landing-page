import { existsSync } from 'node:fs';
import {
  AGENT_PROTOCOL_VERSION,
  buildAgentContext,
  buildAgentContextWhenMissing,
} from './agent-context.mjs';
import { readStoredRecord } from './record-store.mjs';
import { fail, parseArgs, write } from './utils.mjs';
import { runCli as runWorkflowCli } from './workflow-cli.mjs';
import { resolveWorkflowWorkspace } from './workspace.mjs';

function json(stdout, value) {
  write(stdout, JSON.stringify(value, null, 2));
}

function isAgentContextCommand(command, options) {
  return command === 'agent-context' || (command === 'context' && options.agent === true);
}

function printAgentContext(stdout, value) {
  if (!value.initialized) {
    write(stdout, value.nextAction);
    return;
  }
  write(stdout, `${value.project.name}: Stage ${value.state.stage} — ${value.state.stageName}`);
  write(stdout, `Execution: ${value.state.executionKind}`);
  write(stdout, `Resolved resources: ${value.resources.required.length + value.resources.templates.length}`);
  write(stdout, `Next action: ${value.nextAction}`);
}

export async function runCli(args, environment) {
  const { cwd, stdout, stderr } = environment;
  const { positionals, options } = parseArgs(args);
  const command = positionals[0];

  if (!isAgentContextCommand(command, options)) {
    const result = await runWorkflowCli(args, environment);
    if (!command || command === 'help' || options.help) {
      write(stdout, '\nFast agent bootstrap:');
      write(stdout, '  design-workflow agent-context [--json]');
      write(stdout, '  design-workflow context --agent [--json]');
    }
    return result;
  }

  const workspace = resolveWorkflowWorkspace(cwd, options.record);
  const { recordPath, projectRoot } = workspace;
  if (!existsSync(recordPath)) {
    const value = buildAgentContextWhenMissing(recordPath, { cwd: projectRoot });
    if (options.json) json(stdout, value); else printAgentContext(stdout, value);
    return 0;
  }

  try {
    const { record } = readStoredRecord(recordPath);
    const value = buildAgentContext(recordPath, record, { cwd: projectRoot });
    if (options.json) json(stdout, value); else printAgentContext(stdout, value);
    return value.workflow.valid ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      json(stdout, {
        protocolVersion: AGENT_PROTOCOL_VERSION,
        contextProtocolVersion: null,
        initialized: true,
        toolkit: null,
        workflow: { valid: false, findings: [message] },
        state: { executionKind: 'repair' },
        policy: { codeEdits: 'forbidden', workflowReads: 'repair-only' },
        resources: {
          required: [],
          stagePrompt: null,
          guidance: [],
          templates: [],
          conditional: [],
        },
        nextAction: 'Repair the workflow record before continuing.',
      });
      return 1;
    }
    return fail(stderr, message);
  }
}
