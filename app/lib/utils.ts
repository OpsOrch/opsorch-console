export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function stringify(obj?: Record<string, unknown>) {
  if (!obj || Object.keys(obj).length === 0) return null;
  return JSON.stringify(obj, null, 2);
}
