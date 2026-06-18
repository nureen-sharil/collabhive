export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class APIClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("access_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("access_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("access_token");
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = "/login";
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || "API Error");
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: "DELETE" });
  }

  async uploadFile(endpoint: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : "",
      },
      body: formData,
    });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = "/login";
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Upload failed");
    }

    return data;
  }
}

export const apiClient = new APIClient();
