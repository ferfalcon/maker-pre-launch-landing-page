import {
  inspectWorkflowRecord as inspectCoreWorkflowRecord,
} from '../../scripts/lib/validate-workflow-record.mjs';
import { ID_PATTERNS } from './workflow-model.mjs';

const TOOLKIT_REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA256 = /^[0-9a-f]{64}$/;
const RUNTIME_ID = /^SRC-RUN-[0-9]{3,}$/;

function push(findings, path, message) {
  findings.push(`${path}: ${message}`);
}

function exactObject(findings, path, value, required) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    push(findings, path, 'expected an object');
    return false;
  }
  const allowed = new Set(required);
  for (const key of required) {
    if (!Object.hasOwn(value, key)) push(findings, `${path}.${key}`, 'required property is missing');
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) push(findings, `${path}.${key}`, 'unknown property');
  }
  return true;
}

function validateContentRevision(findings, path, revision) {
  if (!exactObject(findings, path, revision, ['algorithm', 'digest'])) return;
  if (revision.algorithm !== 'sha256') push(findings, `${path}.algorithm`, 'must equal sha256');
  if (typeof revision.digest !== 'string' || !SHA256.test(revision.digest)) {
    push(findings, `${path}.digest`, 'must be a 64-character lowercase SHA-256 digest');
  }
}

function validateValidationSubject(findings, path, subject) {
  const required = subject?.runtime === undefined ? ['commit'] : ['commit', 'runtime'];
  if (!exactObject(findings, path, subject, required)) return;
  if (typeof subject.commit !== 'string' || !ID_PATTERNS.commit.test(subject.commit)) {
    push(findings, `${path}.commit`, 'must be an exact 40-character Git SHA');
  }
  if (subject.runtime !== undefined && (typeof subject.runtime !== 'string' || !RUNTIME_ID.test(subject.runtime))) {
    push(findings, `${path}.runtime`, 'must be a validation-runtime snapshot ID');
  }
}

function identityShapeFindings(record) {
  if (record?.schemaVersion !== 2) return [];
  const findings = [];

  if (record.toolkit !== undefined) {
    if (exactObject(findings, '$.toolkit', record.toolkit, ['repository', 'revision'])) {
      if (typeof record.toolkit.repository !== 'string' || !TOOLKIT_REPOSITORY.test(record.toolkit.repository)) {
        push(findings, '$.toolkit.repository', 'must use owner/name form');
      }
      if (typeof record.toolkit.revision !== 'string' || !ID_PATTERNS.commit.test(record.toolkit.revision)) {
        push(findings, '$.toolkit.revision', 'must be an exact 40-character Git SHA');
      }
    }
  }

  (record.artifacts ?? []).forEach((artifact, index) => {
    if (artifact.approvedRevision !== undefined) {
      validateContentRevision(findings, `$.artifacts[${index}].approvedRevision`, artifact.approvedRevision);
    }
  });

  (record.gates ?? []).forEach((gate, gateIndex) => {
    if (gate.artifactRevisions === undefined) return;
    if (!Array.isArray(gate.artifactRevisions)) {
      push(findings, `$.gates[${gateIndex}].artifactRevisions`, 'expected an array');
      return;
    }
    const seen = new Set();
    gate.artifactRevisions.forEach((entry, entryIndex) => {
      const path = `$.gates[${gateIndex}].artifactRevisions[${entryIndex}]`;
      if (!exactObject(findings, path, entry, ['artifact', 'revision'])) return;
      if (typeof entry.artifact !== 'string' || !ID_PATTERNS.artifact.test(entry.artifact)) {
        push(findings, `${path}.artifact`, 'must be an artifact ID');
      }
      if (seen.has(entry.artifact)) push(findings, `${path}.artifact`, 'duplicate artifact revision entry');
      seen.add(entry.artifact);
      validateContentRevision(findings, `${path}.revision`, entry.revision);
    });
  });

  (record.tasks ?? []).forEach((task, taskIndex) => {
    (task.validation ?? []).forEach((check, checkIndex) => {
      if (check.subject !== undefined) {
        validateValidationSubject(findings, `$.tasks[${taskIndex}].validation[${checkIndex}].subject`, check.subject);
      }
    });
  });

  (record.implementationReviews ?? []).forEach((review, index) => {
    if (review.artifactRevision !== undefined) {
      validateContentRevision(findings, `$.implementationReviews[${index}].artifactRevision`, review.artifactRevision);
    }
  });

  return findings;
}

function coreProjection(record) {
  const projected = structuredClone(record);
  for (const artifact of projected.artifacts ?? []) delete artifact.approvedRevision;
  for (const gate of projected.gates ?? []) delete gate.artifactRevisions;
  for (const task of projected.tasks ?? []) {
    for (const check of task.validation ?? []) delete check.subject;
  }
  for (const review of projected.implementationReviews ?? []) delete review.artifactRevision;
  return projected;
}

export function inspectWorkflowRecord(record) {
  const core = inspectCoreWorkflowRecord(coreProjection(record));
  return {
    errors: [...core.errors, ...identityShapeFindings(record)],
    warnings: core.warnings,
  };
}

export function validateWorkflowRecord(record) {
  return inspectWorkflowRecord(record).errors;
}
