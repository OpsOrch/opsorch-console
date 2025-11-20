export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function stringify(obj?: Record<string, unknown>) {
  if (!obj || Object.keys(obj).length === 0) return null;
  return JSON.stringify(obj, null, 2);
}

export function parseJsonString(text?: unknown) {
  if (typeof text !== "string") return undefined;
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export function stringifyData(data: unknown) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return `Unable to render data: ${err instanceof Error ? err.message : String(err)}`;
  }
}