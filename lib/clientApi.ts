// server intentionally serverless/stateless: the browser holds the StudentVUE login and sends it with each request).

export const CREDS_STORAGE_KEY = "Student.creds";

export interface StoredCredentials {
  district_url: string;
  username: string;
  password: string;
  [k: string]: unknown;
}

export function getStoredCredentials(): StoredCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CREDS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    // older versions of the app stored the district under different keys
    if (!parsed.district_url && (parsed.district || parsed.host)) {
      parsed.district_url = parsed.district || parsed.host;
    }
    return parsed as StoredCredentials;
  } catch {
    return null;
  }
}

export function saveStoredCredentials(creds: StoredCredentials) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CREDS_STORAGE_KEY, JSON.stringify(creds));
  } catch {}
}

export function clearStoredCredentials() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CREDS_STORAGE_KEY);
  } catch {}
}

export async function postJson<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? String((data as { error: unknown }).error)
        : `HTTP error! status: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export async function synergyPost<T = unknown>(
  path: string,
  creds: StoredCredentials,
  extra?: Record<string, unknown>,
): Promise<T> {
  return postJson<T>(path, { ...creds, ...extra });
}
