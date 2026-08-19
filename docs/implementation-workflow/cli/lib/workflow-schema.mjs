import {
  ARTIFACT_STATUSES, ARTIFACT_TYPES, FINAL_RESULTS, GATE_RESULTS,
  ID_PATTERN_SOURCES, MODES, PIN_STRENGTHS, PROFILES, SCHEMA_VERSION,
  SNAPSHOT_ROLES, SNAPSHOT_STATUSES, TASK_STATUSES, VALIDATION_KINDS,
  VALIDATION_STATUSES, VERIFICATION_RESULTS, WORKFLOW_STATUSES,
} from './workflow-model.mjs';

function nullable(schema) {
  return { anyOf: [schema, { type: 'null' }] };
}

function stringArray(items, options = {}) {
  return {
    type: 'array', items, uniqueItems: true, ...(options.minItems ? { minItems: options.minItems } : {}),
  };
}

const nonEmptyString = { type: 'string', minLength: 1 };
const timestamp = { type: 'string', format: 'date-time' };
const toolkitRepository = { type: 'string', pattern: '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' };

export function buildWorkflowRecordSchemaV2() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://github.com/ferfalcon/figma-to-implementation-workflow/schemas/workflow-record.schema.json',
    title: 'Design-to-Implementation Workflow Record',
    description: 'Canonical schema-v2 control record for workflow state, toolkit identity, gates, source verification, artifacts, traceability, tasks, profile transitions, validation, and final review.',
    type: 'object',
    additionalProperties: false,
    required: [
      'schemaVersion', 'project', 'state', 'snapshots', 'verifications',
      'artifacts', 'traceItems', 'gates', 'tasks', 'profileTransitions',
      'implementationReviews',
    ],
    properties: {
      schemaVersion: { const: SCHEMA_VERSION },
      project: {
        type: 'object', additionalProperties: false,
        required: ['name', 'profile', 'executionMode'],
        properties: {
          name: nonEmptyString,
          profile: { enum: PROFILES },
          executionMode: { enum: MODES },
        },
      },
      toolkit: {
        type: 'object', additionalProperties: false,
        required: ['repository', 'revision'],
        properties: {
          repository: toolkitRepository,
          revision: { type: 'string', pattern: ID_PATTERN_SOURCES.commit },
        },
      },
      state: {
        type: 'object', additionalProperties: false,
        required: [
          'stage', 'status', 'activeInputs', 'currentTask', 'latestOutput',
          'latestValidationRuntime', 'architectureDecision',
        ],
        properties: {
          stage: { type: 'integer', minimum: 0, maximum: 11 },
          status: { enum: WORKFLOW_STATUSES },
          activeInputs: stringArray({ $ref: '#/$defs/snapshotId' }),
          currentTask: nullable({ $ref: '#/$defs/taskId' }),
          latestOutput: nullable({ $ref: '#/$defs/repositorySnapshotId' }),
          latestValidationRuntime: nullable({ $ref: '#/$defs/runtimeSnapshotId' }),
          architectureDecision: nullable({
            type: 'object', additionalProperties: false,
            required: ['result', 'reason', 'recordedAt'],
            properties: {
              result: { enum: ['Required', 'Not required'] },
              reason: nonEmptyString,
              recordedAt: timestamp,
            },
          }),
        },
      },
      snapshots: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['id', 'role', 'pinStrength', 'status', 'reference'],
          properties: {
            id: { $ref: '#/$defs/snapshotId' },
            role: { enum: SNAPSHOT_ROLES },
            pinStrength: { enum: PIN_STRENGTHS },
            status: { enum: SNAPSHOT_STATUSES },
            reference: nonEmptyString,
            commit: { type: 'string', pattern: ID_PATTERN_SOURCES.commit },
            parent: { $ref: '#/$defs/repositorySnapshotId' },
            task: { $ref: '#/$defs/taskId' },
            supersededBy: { $ref: '#/$defs/snapshotId' },
          },
        },
      },
      verifications: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['id', 'snapshot', 'result', 'method', 'evidence', 'checkedAt'],
          properties: {
            id: { $ref: '#/$defs/verificationId' },
            snapshot: { $ref: '#/$defs/snapshotId' },
            result: { enum: VERIFICATION_RESULTS },
            method: nonEmptyString,
            evidence: nonEmptyString,
            checkedAt: timestamp,
            replacement: { $ref: '#/$defs/snapshotId' },
          },
        },
      },
      artifacts: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['id', 'type', 'path', 'status', 'baseline'],
          properties: {
            id: { $ref: '#/$defs/artifactId' },
            type: { enum: ARTIFACT_TYPES },
            path: nonEmptyString,
            status: { enum: ARTIFACT_STATUSES },
            baseline: stringArray({ $ref: '#/$defs/snapshotId' }),
            statusChangedAt: timestamp,
            statusEvidence: nonEmptyString,
            statusBy: nonEmptyString,
            approvedRevision: { $ref: '#/$defs/contentRevision' },
            supersededBy: { $ref: '#/$defs/artifactId' },
          },
        },
      },
      traceItems: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['id', 'owner', 'status', 'required', 'references'],
          properties: {
            id: { $ref: '#/$defs/domainId' },
            owner: { $ref: '#/$defs/artifactId' },
            status: { enum: ['Active', 'Superseded'] },
            required: { type: 'boolean' },
            references: stringArray({ $ref: '#/$defs/domainId' }),
            supersededBy: { $ref: '#/$defs/domainId' },
          },
        },
      },
      gates: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: [
            'id', 'stage', 'status', 'result', 'baseline', 'verifications',
            'artifacts', 'evidence', 'recordedAt',
          ],
          properties: {
            id: { $ref: '#/$defs/gateId' },
            stage: { type: 'integer', minimum: 0, maximum: 11 },
            status: { enum: ['Active', 'Superseded'] },
            result: { enum: GATE_RESULTS },
            baseline: stringArray({ $ref: '#/$defs/snapshotId' }),
            verifications: stringArray({ $ref: '#/$defs/verificationId' }),
            artifacts: stringArray({ $ref: '#/$defs/artifactId' }),
            artifactRevisions: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: false,
                required: ['artifact', 'revision'],
                properties: {
                  artifact: { $ref: '#/$defs/artifactId' },
                  revision: { $ref: '#/$defs/contentRevision' },
                },
              },
            },
            evidence: nonEmptyString,
            recordedAt: timestamp,
            approvedBy: nonEmptyString,
          },
        },
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: [
            'id', 'status', 'baseline', 'prerequisites', 'references',
            'output', 'blocker', 'validation',
          ],
          properties: {
            id: { $ref: '#/$defs/taskId' },
            status: { enum: TASK_STATUSES },
            baseline: { $ref: '#/$defs/repositorySnapshotId' },
            prerequisites: stringArray({ $ref: '#/$defs/taskId' }),
            references: stringArray({ $ref: '#/$defs/domainId' }),
            output: nullable({ $ref: '#/$defs/repositorySnapshotId' }),
            blocker: nullable({
              type: 'object', additionalProperties: false,
              required: ['reason', 'previousStatus', 'recordedAt'],
              properties: {
                reason: nonEmptyString,
                previousStatus: { enum: ['Not started', 'Ready', 'In progress'] },
                recordedAt: timestamp,
              },
            }),
            validation: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: false,
                required: [
                  'name', 'kind', 'required', 'status', 'expected',
                  'evidence', 'references',
                ],
                properties: {
                  name: nonEmptyString,
                  kind: { enum: VALIDATION_KINDS },
                  required: { type: 'boolean' },
                  status: { enum: VALIDATION_STATUSES },
                  expected: nonEmptyString,
                  actual: nonEmptyString,
                  command: nonEmptyString,
                  environment: nonEmptyString,
                  executedAt: timestamp,
                  subject: { $ref: '#/$defs/validationSubject' },
                  evidence: stringArray(nonEmptyString),
                  reason: nonEmptyString,
                  references: stringArray({ $ref: '#/$defs/domainId' }),
                },
              },
            },
          },
        },
      },
      profileTransitions: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: [
            'id', 'from', 'to', 'resumeStage', 'reason', 'status',
            'sourceArtifacts', 'targetArtifacts', 'startedAt',
          ],
          properties: {
            id: { $ref: '#/$defs/profileTransitionId' },
            from: { enum: PROFILES },
            to: { enum: PROFILES },
            resumeStage: { type: 'integer', minimum: 0, maximum: 11 },
            reason: nonEmptyString,
            status: { enum: ['In progress', 'Complete'] },
            sourceArtifacts: stringArray({ $ref: '#/$defs/artifactId' }),
            targetArtifacts: stringArray({ $ref: '#/$defs/artifactId' }),
            startedAt: timestamp,
            completedAt: timestamp,
            evidence: nonEmptyString,
            approvedBy: nonEmptyString,
          },
        },
      },
      implementationReviews: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: [
            'id', 'status', 'result', 'artifact', 'output', 'evidence',
            'recordedAt', 'approvedBy', 'deviations',
          ],
          properties: {
            id: { $ref: '#/$defs/reviewId' },
            status: { enum: ['Active', 'Superseded'] },
            result: { enum: FINAL_RESULTS },
            artifact: { $ref: '#/$defs/artifactId' },
            artifactRevision: { $ref: '#/$defs/contentRevision' },
            output: { $ref: '#/$defs/repositorySnapshotId' },
            runtime: { $ref: '#/$defs/runtimeSnapshotId' },
            evidence: nonEmptyString,
            recordedAt: timestamp,
            approvedBy: nonEmptyString,
            deviations: stringArray(nonEmptyString),
          },
        },
      },
      legacyBoundary: {
        type: 'object', additionalProperties: false,
        required: ['migratedFrom', 'gatesRequiredFromStage', 'traceRequiredFromStage'],
        properties: {
          migratedFrom: { const: 1 },
          gatesRequiredFromStage: { type: 'integer', minimum: 0, maximum: 11 },
          traceRequiredFromStage: { type: 'integer', minimum: 0, maximum: 11 },
        },
      },
    },
    $defs: {
      snapshotId: { type: 'string', pattern: ID_PATTERN_SOURCES.snapshot },
      repositorySnapshotId: { type: 'string', pattern: ID_PATTERN_SOURCES.repositorySnapshot },
      runtimeSnapshotId: { type: 'string', pattern: '^SRC-RUN-[0-9]{3,}$' },
      taskId: { type: 'string', pattern: ID_PATTERN_SOURCES.task },
      artifactId: { type: 'string', pattern: ID_PATTERN_SOURCES.artifact },
      verificationId: { type: 'string', pattern: ID_PATTERN_SOURCES.verification },
      gateId: { type: 'string', pattern: ID_PATTERN_SOURCES.gate },
      profileTransitionId: { type: 'string', pattern: ID_PATTERN_SOURCES.profileTransition },
      reviewId: { type: 'string', pattern: ID_PATTERN_SOURCES.review },
      domainId: { type: 'string', pattern: ID_PATTERN_SOURCES.domain },
      contentRevision: {
        type: 'object', additionalProperties: false,
        required: ['algorithm', 'digest'],
        properties: {
          algorithm: { const: 'sha256' },
          digest: { type: 'string', pattern: '^[0-9a-f]{64}$' },
        },
      },
      validationSubject: {
        type: 'object', additionalProperties: false,
        required: ['commit'],
        properties: {
          commit: { type: 'string', pattern: ID_PATTERN_SOURCES.commit },
          runtime: { $ref: '#/$defs/runtimeSnapshotId' },
        },
      },
    },
  };
}
