/**
 * Parses a comma-separated string of OAuth OAuth scopes into an array of individual scope strings.
 *
 * @param scopes - A comma-separated string of OAuth OAuth scopes.
 * @returns An array of trimmed individual scope strings.
 *
 * @example
 * ```
 * const scopesString = "profile,email, openid";
 * const parsedScopes = oAuthScopeParse(scopesString);
 *
 * // Result: ["profile", "email", "openid"]
 * ```
 */
export function oAuthParseScope(scopes: string): string[] {
  // trim the string
  const scopesTrimmed = scopes.trim();

  // is there any length?
  if (!scopes.length) {
    // no, return empty array
    return [];
  }

  // get raw strings
  const scopeTypes: string[] = scopesTrimmed.split(',');

  // trim all scopes
  return scopeTypes.map((scope) => {
    return scope.trim();
  });
}
