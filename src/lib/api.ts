const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "http://mysql://avnadmin:AVNS_KvLtKHiIDpk-wLKhpj2@mysql-c7d044d-collabhive.l.aivencloud.com:17415/defaultdb?ssl-mode=REQUIRED:8000";

export function buildApiUrl(path: string) {
	return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
