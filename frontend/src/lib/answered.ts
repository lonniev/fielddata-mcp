/** A tool that refuses answers `success: false` rather than failing the call, so the page must ask. */
export function answered<T>(result: T): T {
  const r = result as { success?: boolean; error?: string; message?: string };
  if (r?.success === false) throw new Error(r.error ?? r.message ?? "The service refused that request.");
  return result;
}
