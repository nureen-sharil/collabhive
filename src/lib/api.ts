const DEFAULT_API_BASE_URL = import.meta.env.PROD ? "/_/backend" : "http://localhost:8000";
const API_BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined)?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, "");

export function buildApiUrl(path: string) {
	return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
