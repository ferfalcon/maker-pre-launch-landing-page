import { generatedStateFindings } from './generated-state.mjs';
import { subjectIntegrityFindings } from './subject-integrity.mjs';
import { validateWorkflowRecord } from './canonical-validation.mjs';

export function workflowDiagnostics(recordPath, record) {
  const recordFindings = validateWorkflowRecord(record);
  const generatedFindings = generatedStateFindings(recordPath, record);
  const integrityFindings = subjectIntegrityFindings(recordPath, record);
  return {
    recordValid: recordFindings.length === 0,
    generatedViewsCurrent: generatedFindings.length === 0,
    subjectIntegrityCurrent: integrityFindings.length === 0,
    valid: recordFindings.length === 0 && generatedFindings.length === 0 && integrityFindings.length === 0,
    recordFindings,
    generatedFindings,
    integrityFindings,
    findings: [...recordFindings, ...generatedFindings, ...integrityFindings],
  };
}
