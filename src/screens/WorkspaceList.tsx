import { useEffect, useState } from "react";
import { useNavigate } from "src/app/router";
import { useWorkspaces, workspaceStore } from "src/app/context/WorkspaceContext";
import { PhoneFrame } from "src/app/components/PhoneFrame";
import { Plus, Users, FolderKanban, Loader2 } from "lucide-react";

export function WorkspaceList() {
  const navigate = useNavigate();
  
  // Pull the synced global workspaces array from your custom hook
  const { workspaces } = useWorkspaces();

  // Local state handles components visual loading feedback loops
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem("currentUser") ?? localStorage.getItem("collabhive.auth.currentUser");
    if (sessionStr) {
      const user = JSON.parse(sessionStr);
      if (user?.id) {
        setLoading(true);
        setError(null);
        
        // Triggers database lookup using the singleton store API
        workspaceStore.syncFromBackend(user.id)
          .catch((err) => {
            setError(err.message || "Failed to query secure MySQL workspace clusters.");
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, []);

  return (
    <PhoneFrame indicatorBg="#F9FAFB">
      <div className="bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">CollabHive</h1>
          <p className="text-xs text-gray-500 font-medium">Your persistent project platforms</p>
        </div>
        <button
          onClick={() => navigate("/workspaces/create")}
          className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span className="text-xs font-medium">Querying secure MySQL workspace clusters...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold border border-red-100">
            {error}
          </div>
        )}

        {!loading && workspaces.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-200">
            <FolderKanban size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-sm font-bold text-gray-800">No active work hubs found</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
              You are not a member of any workspaces. Click the plus button above to build one!
            </p>
          </div>
        )}

        {!loading && workspaces.length > 0 && (
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between relative overflow-hidden group"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                  style={{ backgroundColor: ws.color }}
                />

                <div className="pl-2 space-y-1 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate tracking-tight">
                    {ws.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-1 pr-4">
                    {ws.description || "No project overview description provided."}
                  </p>
                  
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users size={12} />
                      <span className="text-[11px] font-bold text-gray-500">{ws.members?.length || 1}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: ws.color, width: `${ws.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600">{ws.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
