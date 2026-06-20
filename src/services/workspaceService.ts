import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export interface WorkspaceMember {
  user_id: number;
  name: string;
  email: string;
  role: "owner" | "member";
}

export interface WorkspaceData {
  id: string | number;
  workspace_name: string;
  description: string;
  owner_id: number;
  color: string;
  progress: number;
  created_at: string;
  members: WorkspaceMember[];
}

export const workspaceService = {
  async getUserWorkspaces(userId: number): Promise<WorkspaceData[]> {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/workspaces`);
    return response.data;
  },

  async createWorkspace(name: string, description: string, color: string, ownerId: number): Promise<WorkspaceData> {
    const response = await axios.post(`${API_BASE_URL}/workspaces`, {
      workspace_name: name,
      description,
      color,
      owner_id: ownerId
    });
    return response.data;
  }
};