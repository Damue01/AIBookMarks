import type { UserRule } from '@/shared/types';
import { extractDomain } from '@/shared/utils';

/**
 * Check if a bookmark URL matches a given user rule.
 */
export function matchesRule(url: string, rule: UserRule): boolean {
  if (!rule.enabled) return false;

  const pattern = rule.pattern.trim();

  try {
    switch (rule.matchType) {
      case 'domain': {
        const domain = extractDomain(url);
        const ruleBase = pattern.replace(/^www\./, '');
        return domain === ruleBase || domain.endsWith(`.${ruleBase}`);
      }

      case 'wildcard': {
        // Convert wildcard pattern to regex
        const escaped = pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex metacharacters except *
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${escaped}$`, 'i');
        const domain = extractDomain(url);
        return regex.test(domain) || regex.test(url);
      }

      case 'regex': {
        const regex = new RegExp(pattern, 'i');
        return regex.test(url);
      }
    }
  } catch {
    // Invalid regex or other error — skip rule
    return false;
  }
}

/**
 * Find the first matching rule for a bookmark URL.
 * Rules are applied in order; the first match wins.
 */
export function findMatchingRule(url: string, rules: UserRule[]): UserRule | null {
  for (const rule of rules) {
    if (matchesRule(url, rule)) return rule;
  }
  return null;
}

/**
 * Apply user rules to a list of suggestions, overriding AI suggestions if a rule matches.
 * Returns modified suggestions.
 */
export function applyRulesToSuggestions<T extends { url: string; suggestedFolderPath: string; isNewFolder: boolean; reason?: string }>(
  suggestions: T[],
  rules: UserRule[],
): T[] {
  return suggestions.map((s) => {
    const rule = findMatchingRule(s.url, rules);
    if (rule) {
      return {
        ...s,
        suggestedFolderPath: rule.targetFolderPath,
        isNewFolder: false, // rules reference existing folders
        reason: `Rule: ${rule.name}`,
      };
    }
    return s;
  });
}
