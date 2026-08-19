const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export function push(findings, path, message) {
  findings.push(`${path}: ${message}`);
}

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function expectObject(errors, path, value) {
  if (isObject(value)) return true;
  push(errors, path, 'expected an object');
  return false;
}

export function expectArray(errors, path, value) {
  if (Array.isArray(value)) return true;
  push(errors, path, 'expected an array');
  return false;
}

export function expectString(errors, path, value, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (typeof value === 'string' && value.trim() !== '') return true;
  push(errors, path, 'must be a non-empty string');
  return false;
}

export function expectEnum(errors, path, value, allowed, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (allowed.includes(value)) return true;
  push(errors, path, `expected one of: ${allowed.join(', ')}`);
  return false;
}

export function expectPattern(errors, path, value, pattern, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (typeof value === 'string' && pattern.test(value)) return true;
  push(errors, path, `invalid identifier or value: ${String(value)}`);
  return false;
}

export function expectTimestamp(errors, path, value, { optional = false } = {}) {
  if (optional && value === undefined) return true;
  if (typeof value === 'string' && isoTimestamp.test(value) && !Number.isNaN(Date.parse(value))) return true;
  push(errors, path, 'must be an ISO-8601 UTC timestamp');
  return false;
}

export function checkShape(errors, path, value, required, allowed = required) {
  if (!expectObject(errors, path, value)) return false;
  for (const key of required) {
    if (!Object.hasOwn(value, key)) push(errors, `${path}.${key}`, 'required property is missing');
  }
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) push(errors, `${path}.${key}`, 'unknown property');
  }
  return true;
}

export function checkUnique(errors, path, values) {
  if (!Array.isArray(values)) return;
  const seen = new Map();
  values.forEach((value, index) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) push(errors, `${path}[${index}]`, `duplicate array value; first declared at ${path}[${seen.get(key)}]`);
    else seen.set(key, index);
  });
}

export function checkIdArray(errors, path, value, pattern) {
  if (!expectArray(errors, path, value)) return [];
  checkUnique(errors, path, value);
  value.forEach((id, index) => expectPattern(errors, `${path}[${index}]`, id, pattern));
  return value;
}

export function registerId(errors, registry, id, path) {
  if (registry.has(id)) push(errors, path, `duplicate ID; first declared at ${registry.get(id)}`);
  else registry.set(id, path);
}

export function findCycles(nodes, neighbors) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(id) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      cycles.push([...stack.slice(start), id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    for (const neighbor of neighbors(id)) {
      if (nodes.has(neighbor)) visit(neighbor);
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of nodes) visit(id);
  return cycles;
}
