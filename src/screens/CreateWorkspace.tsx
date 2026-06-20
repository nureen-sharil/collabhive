import { useState, useEffect } from "react";
import { useNavigate } from "src/app/router";
import { useWorkspaces, workspaceStore } from "src/app/context/WorkspaceContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PhoneFrame } from "src/app/components/PhoneFrame";

export function CreateWorkspace() {
  const navigate = useNavigate();
  
  // Destructure workspaces so React tracks context updates
  const { workspaces } = useWorkspaces();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2563EB");
  
  // 1. ADDED: State to manage the user-selected project deadline date
  const [deadline, setDeadline] = useState("");
  
  const [uiError, setUiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = ["#2563EB", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899"];

  useEffect(() => {
    console.log("📊 Active Front-End Workspaces Cache Count:", workspaces.length);
  }, [workspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Submit button clicked!");
    setUiError(null);

    if (!name.trim()) {
      setUiError("Workspace name cannot be left empty.");
      return;
    }

    const sessionStr = localStorage.getItem("user");
    if (!sessionStr) {
      setUiError("User session context missing. Re-login.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("📡 Sending workspace payload to store API...");
      
      // 2. FIXED: Included 'deadline' key in the database dispatch request
      const newWorkspaceId = await workspaceStore.add({
        title: name.trim(),
        description: description.trim(),
        color: color,
        deadline: deadline // Sends the input value (or empty string if skipped)
      });

      console.log("✅ Successfully saved with generated ID:", newWorkspaceId);
      navigate("/");
    } catch (err: any) {
      console.error("💥 Workspace creation failed runtime error:", err);
      setUiError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PhoneFrame indicatorBg="#F9FAFB">
      <div className="bg-white flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <button onClick={() => navigate("/")} className="p-1" type="button">
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">New Workspace</h1>
      </div>

      <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-5">
        {uiError && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
            {uiError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workspace Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., UI/UX Group Assignment"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
          <textarea
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide core guidelines or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* 3. ADDED: Native Date Picker input field block */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Project Deadline</label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Workspace Identity Color</label>
          <div className="flex gap-3">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "#111827" : "transparent",
                  transform: color === c ? "scale(1.15)" : "scale(1)"
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving to MySQL Database...
            </>
          ) : (
            "Create Workspace"
          )}
        </button>
      </form>
    </PhoneFrame>
  );
}