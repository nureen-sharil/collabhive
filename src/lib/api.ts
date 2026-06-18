import { apiClient, API_BASE_URL } from "./apiClient";

export const authAPI = {
  register: (data: {
    email: string;
    name: string;
    password: string;
  }) => apiClient.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post("/auth/login", data),

  getCurrentUser: () => apiClient.get("/auth/me"),

  updateProfile: (data: any) =>
    apiClient.put("/auth/me", data),

  changePassword: (data: {
    old_password: string;
    new_password: string;
  }) => apiClient.post("/auth/change-password", data),
};

export const workspaceAPI = {
  list: () => apiClient.get("/workspaces"),

  create: (data: {
    title: string;
    description?: string;
    color?: string;
    deadline?: string;
    member_ids?: number[];
  }) => apiClient.post("/workspaces", data),

  get: (id: number) => apiClient.get(`/workspaces/${id}`),

  update: (id: number, data: any) =>
    apiClient.put(`/workspaces/${id}`, data),

  delete: (id: number) => apiClient.delete(`/workspaces/${id}`),

  getOverview: (id: number) =>
    apiClient.get(`/workspaces/${id}/overview`),

  addMember: (workspaceId: number, userId: number) =>
    apiClient.post(`/workspaces/${workspaceId}/members/${userId}`, {}),

  removeMember: (workspaceId: number, userId: number) =>
    apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),
};

export const taskAPI = {
  list: (
    workspaceId: number,
    filters?: {
      status?: string;
      priority?: string;
      my_tasks_only?: boolean;
    }
  ) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.my_tasks_only) params.append("my_tasks_only", "true");

    return apiClient.get(
      `/workspaces/${workspaceId}/tasks?${params.toString()}`
    );
  },

  create: (workspaceId: number, data: any) =>
    apiClient.post(`/workspaces/${workspaceId}/tasks`, data),

  get: (workspaceId: number, taskId: number) =>
    apiClient.get(`/workspaces/${workspaceId}/tasks/${taskId}`),

  update: (workspaceId: number, taskId: number, data: any) =>
    apiClient.put(`/workspaces/${workspaceId}/tasks/${taskId}`, data),

  delete: (workspaceId: number, taskId: number) =>
    apiClient.delete(`/workspaces/${workspaceId}/tasks/${taskId}`),

  addComment: (workspaceId: number, taskId: number, data: { text: string }) =>
    apiClient.post(
      `/workspaces/${workspaceId}/tasks/${taskId}/comments`,
      data
    ),

  getComments: (workspaceId: number, taskId: number) =>
    apiClient.get(`/workspaces/${workspaceId}/tasks/${taskId}/comments`),

  deleteComment: (
    workspaceId: number,
    taskId: number,
    commentId: number
  ) =>
    apiClient.delete(
      `/workspaces/${workspaceId}/tasks/${taskId}/comments/${commentId}`
    ),
};

export const meetingAPI = {
  list: (workspaceId: number) =>
    apiClient.get(`/workspaces/${workspaceId}/meetings`),

  create: (workspaceId: number, data: any) =>
    apiClient.post(`/workspaces/${workspaceId}/meetings`, data),

  get: (workspaceId: number, meetingId: number) =>
    apiClient.get(`/workspaces/${workspaceId}/meetings/${meetingId}`),

  update: (workspaceId: number, meetingId: number, data: any) =>
    apiClient.put(`/workspaces/${workspaceId}/meetings/${meetingId}`, data),

  delete: (workspaceId: number, meetingId: number) =>
    apiClient.delete(`/workspaces/${workspaceId}/meetings/${meetingId}`),

  vote: (
    workspaceId: number,
    meetingId: number,
    slotId: number
  ) =>
    apiClient.post(
      `/workspaces/${workspaceId}/meetings/${meetingId}/vote/${slotId}`,
      {}
    ),

  getVoteStats: (workspaceId: number, meetingId: number) =>
    apiClient.get(
      `/workspaces/${workspaceId}/meetings/${meetingId}/vote-stats`
    ),
};

export const chatAPI = {
  getMessages: (workspaceId: number, limit = 50, offset = 0) =>
    apiClient.get(
      `/workspaces/${workspaceId}/messages?limit=${limit}&offset=${offset}`
    ),

  sendMessage: (workspaceId: number, data: { text: string }) =>
    apiClient.post(`/workspaces/${workspaceId}/messages`, data),

  uploadAttachment: (workspaceId: number, messageId: number, file: File) =>
    apiClient.uploadFile(
      `/workspaces/${workspaceId}/messages/${messageId}/attachments`,
      file
    ),

  deleteMessage: (workspaceId: number, messageId: number) =>
    apiClient.delete(`/workspaces/${workspaceId}/messages/${messageId}`),
};

export const fileAPI = {
  list: (workspaceId: number) =>
    apiClient.get(`/workspaces/${workspaceId}/files`),

  upload: (workspaceId: number, file: File) =>
    apiClient.uploadFile(`/workspaces/${workspaceId}/files`, file),

  get: (workspaceId: number, fileId: number) =>
    apiClient.get(`/workspaces/${workspaceId}/files/${fileId}`),

  update: (workspaceId: number, fileId: number, data: any) =>
    apiClient.put(`/workspaces/${workspaceId}/files/${fileId}`, data),

  delete: (workspaceId: number, fileId: number) =>
    apiClient.delete(`/workspaces/${workspaceId}/files/${fileId}`),

  share: (workspaceId: number, fileId: number) =>
    apiClient.post(
      `/workspaces/${workspaceId}/files/${fileId}/share`,
      {}
    ),

  download: (workspaceId: number, fileId: number) =>
    `${API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/download`,
};

export const userAPI = {
  list: () => apiClient.get("/users"),

  get: (id: number) => apiClient.get(`/users/${id}`),

  update: (id: number, data: any) =>
    apiClient.put(`/users/${id}`, data),

  delete: (id: number) => apiClient.delete(`/users/${id}`),
};

export const notificationAPI = {
  list: (workspaceId: number, unreadsOnly = false) =>
    apiClient.get(
      `/workspaces/${workspaceId}/notifications?unread_only=${unreadsOnly}`
    ),

  markRead: (workspaceId: number, notificationId: number) =>
    apiClient.put(
      `/workspaces/${workspaceId}/notifications/${notificationId}/read`,
      {}
    ),

  markAllRead: (workspaceId: number) =>
    apiClient.put(
      `/workspaces/${workspaceId}/notifications/read-all`,
      {}
    ),

  delete: (workspaceId: number, notificationId: number) =>
    apiClient.delete(
      `/workspaces/${workspaceId}/notifications/${notificationId}`
    ),
};
