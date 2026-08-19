import { isAbsolute, relative, resolve, sep } from 'node:path';

export function isPathWithin(parentPath, candidatePath) {
  const parent = resolve(parentPath);
  const candidate = resolve(candidatePath);
  const repositoryRelative = relative(parent, candidate);

  return (
    repositoryRelative === '' ||
    (
      !isAbsolute(repositoryRelative) &&
      repositoryRelative !== '..' &&
      !repositoryRelative.startsWith(`..${sep}`)
    )
  );
}
