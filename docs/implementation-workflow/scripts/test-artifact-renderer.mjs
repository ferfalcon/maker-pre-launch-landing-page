#!/usr/bin/env node

import { renderArtifactTemplate } from '../cli/lib/artifact-renderer.mjs';
import { ARTIFACT_TYPES } from '../cli/lib/workflow-model.mjs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const type of ARTIFACT_TYPES) {
  for (const control of ['cli-managed', 'markdown-only']) {
    const content = renderArtifactTemplate(type, {
      control,
      project: 'Renderer fixture',
      profile: 'Standard',
      mode: 'Gated',
      date: '2026-08-12',
      taskId: 'P01-T01',
      taskTitle: 'Renderer task',
    });
    assert(content.startsWith('---\n'), `${type}/${control}: missing real YAML frontmatter`);
    assert(!content.startsWith('```yaml'), `${type}/${control}: retained fenced example YAML`);
    assert(!content.includes('<!-- artifact:') && !content.includes('<!-- control:'), `${type}/${control}: retained template markers`);
    assert(!/{{[^}\n]+}}|YYYY-MM-DD|<UNRESOLVED:/.test(content), `${type}/${control}: retained an unresolved placeholder`);
    const firstHeading = content.match(/^# .+$/m)?.[0] ?? '';
    assert(!/ Template$/.test(firstHeading), `${type}/${control}: retained the template teaching heading`);
    assert(content.includes('project: Renderer fixture'), `${type}/${control}: project was not substituted`);
    assert(content.includes('profile: Standard'), `${type}/${control}: profile was not substituted`);
    assert(content.includes('execution_mode: Gated'), `${type}/${control}: mode was not substituted`);
    if (control === 'cli-managed') {
      assert(!/^status:/m.test(content), `${type}: duplicated record-owned frontmatter status`);
      assert(!/^#{2,6} (?:Control state|Status|Output Lineage|Artifact Registry|Snapshot Registry)$/mi.test(content), `${type}: duplicated a record-owned body section`);
    }
  }
}
const unsafeFrontmatter = renderArtifactTemplate('WORKPACK', {
  control: 'cli-managed', project: 'Renderer: #1', profile: 'Express', mode: 'Gated', date: '2026-08-12',
});
assert(unsafeFrontmatter.includes('project: "Renderer: #1"'), 'Unsafe project name was not escaped as a YAML string');


const sourceMarkdown = renderArtifactTemplate('SOURCE-BASELINE', {
  control: 'markdown-only', project: 'Renderer fixture', profile: 'Standard', mode: 'Gated', date: '2026-08-12',
});
const sourceManaged = renderArtifactTemplate('SOURCE-BASELINE', {
  control: 'cli-managed', project: 'Renderer fixture', profile: 'Standard', mode: 'Gated', date: '2026-08-12',
});
assert(sourceMarkdown.includes('Markdown-only Snapshot Registry'), 'Markdown-only source fallback registry is missing');
assert(!sourceManaged.includes('Markdown-only Snapshot Registry'), 'CLI-managed source duplicated the fallback registry');

const stateMarkdown = renderArtifactTemplate('WORKFLOW-STATE', {
  control: 'markdown-only', project: 'Renderer fixture', profile: 'Standard', mode: 'Gated', date: '2026-08-12',
});
const stateManaged = renderArtifactTemplate('WORKFLOW-STATE', {
  control: 'cli-managed', project: 'Renderer fixture', profile: 'Standard', mode: 'Gated', date: '2026-08-12',
});
assert(stateMarkdown.includes('Markdown-only Fallback'), 'Markdown-only workflow fallback registry is missing');
assert(!stateManaged.includes('Markdown-only Fallback'), 'CLI-managed workflow duplicated the fallback registry');

console.log(`Artifact renderer tests passed (${ARTIFACT_TYPES.length * 2} profile/control renderings).`);
