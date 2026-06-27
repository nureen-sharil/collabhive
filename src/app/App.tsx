import { usePath, matchPath, _setParams } from "./router";

import { Login }           from "./components/Login";
import { Register }        from "./components/Register";
import { ForgotPassword }  from "./components/ForgotPassword";
import { Dashboard }       from "./components/Dashboard";
import { WorkspaceOverview } from "./components/WorkspaceOverview";
import { TaskBoard }         from "./components/TaskBoard";
import { GroupChat }         from "./components/GroupChat";
import { FileManagement }    from "./components/FileManagement";
import { MeetingScheduler }  from "./components/MeetingScheduler";
import { CreateMeeting }     from "./components/CreateMeeting";
import { CreateWorkspace }   from "./components/CreateWorkspace";
import { CreateTask }        from "./components/CreateTask";
import { EditTask }          from "./components/EditTask";
import { TaskStatusView }    from "./components/TaskStatusView";
import { Settings }          from "./components/Settings";
import { FAQ }               from "./components/FAQ";
import { EditProfile }       from "./components/EditProfile";
import { EditWorkspace }     from "./components/EditWorkspace";

import React from "react";

const ROUTES: { pattern: string; Component: React.ComponentType }[] = [
  // Auth screens
  { pattern: "/login",                              Component: Login            },
  { pattern: "/register",                           Component: Register         },
  { pattern: "/forgot-password",                    Component: ForgotPassword   },
  // App screens
  { pattern: "/workspace/:id/tasks/:taskId/edit",   Component: EditTask         },
  { pattern: "/workspace/:id/tasklist/:status",     Component: TaskStatusView   },
  { pattern: "/workspace/:id/tasks/new",            Component: CreateTask       },
  { pattern: "/workspace/:id/tasks",                Component: TaskBoard        },
  { pattern: "/workspace/:id/meetings/create",      Component: CreateMeeting    },
  { pattern: "/workspace/:id/meetings",             Component: MeetingScheduler },
  { pattern: "/workspace/:id/chat",                 Component: GroupChat        },
  { pattern: "/workspace/:id/files",                Component: FileManagement   },
  { pattern: "/workspace/:id/edit",                 Component: EditWorkspace    },
  { pattern: "/workspace/new",                      Component: CreateWorkspace  },
  { pattern: "/workspace/:id",                      Component: WorkspaceOverview},
  { pattern: "/settings",                           Component: Settings         },
  { pattern: "/edit-profile",                       Component: EditProfile      },
  { pattern: "/faq",                                Component: FAQ              },
  { pattern: "/",                                   Component: Dashboard        },
];

function App() {
  const path = usePath();

  for (const { pattern, Component } of ROUTES) {
    const params = matchPath(pattern, path);
    if (params !== null) {
      _setParams(params);
      return <Component />;
    }
  }

  _setParams({});
  return <Login />;
}

export default App;
