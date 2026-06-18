import { Outlet } from "react-router";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { MeetingProvider } from "../context/MeetingContext";
import { TaskProvider } from "../context/TaskContext";

export function RootLayout() {
  return (
    <WorkspaceProvider>
      <MeetingProvider>
        <TaskProvider>
          <Outlet />
        </TaskProvider>
      </MeetingProvider>
    </WorkspaceProvider>
  );
}
