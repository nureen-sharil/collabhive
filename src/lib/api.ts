const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://localhost:8001";

export function buildApiUrl(path: string) {
	return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
