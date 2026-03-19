export function normalizeWildcardDomain(domain?: string | null): string | null {
  if (!domain) return null;
  const trimmed = domain.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.startsWith('*.') ? trimmed.slice(2) : trimmed;
}

export function wildcardDetectionMatchesDomain(
  detectionDomain?: string | null,
  currentDomain?: string | null
): boolean {
  const normalizedDetection = normalizeWildcardDomain(detectionDomain);
  const normalizedCurrent = normalizeWildcardDomain(currentDomain);
  if (!normalizedDetection || !normalizedCurrent) return false;
  return normalizedDetection === normalizedCurrent;
}
