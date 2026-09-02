export function nextDevCliArgs(input: {
  nodeModulesIsSymlink: boolean;
  extra?: string[];
}): string[] {
  return [
    "dev",
    ...(input.nodeModulesIsSymlink ? ["--webpack"] : []),
    ...(input.extra ?? []),
  ];
}
