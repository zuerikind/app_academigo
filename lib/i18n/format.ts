/** Replace `{key}` placeholders in translated strings. */
export function formatMessage(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (str, [key, val]) => str.replaceAll(`{${key}}`, String(val)),
    template,
  );
}
