// Compatibility adapter for repository scripts and tests.
// Runtime/domain code must import the CLI-owned validator directly.
export {
  inspectWorkflowRecord,
  validateWorkflowRecord,
} from '../../cli/lib/workflow-record-validation.mjs';
