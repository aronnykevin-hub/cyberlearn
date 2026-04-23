import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { User, Mail, Phone, Briefcase, Building2, Save, Edit2, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function EmployeeProfile() {
  const profile = useQuery(api.userProfiles.getMyProfile);
  const updateProfile = useMutation(api.userProfiles.updateProfile);
  const myProgress = useQuery(api.training.getMyProgress) ?? [];
  const modules = useQuery(api.training.listModules) ?? [];

  const [editing, setEditing] = useState(false);
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDepartment(profile?.department ?? "");
    setJobTitle(profile?.jobTitle ?? "");
    setPhone(profile?.phone ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        department: department || undefined,
        jobTitle: jobTitle || undefined,
        phone: phone || undefined,
      });
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const completed = myProgress.filter((p) => p.status === "completed").length;
  const completionRate = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Profile</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your account information</p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
            {(profile?.name ?? profile?.email ?? "U")[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{profile?.name ?? "User"}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile?.role === "admin" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                {profile?.role === "admin" ? "🛡️ Admin" : "👤 Employee"}
              </span>
              {profile?.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-gray-500 flex-shrink-0" />
            <span className="text-gray-400">Email:</span>
            <span className="text-white">{profile?.email ?? "—"}</span>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Job Title</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Department</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Engineering"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +1 555 0100"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-400">Job Title:</span>
                <span className="text-white">{profile?.jobTitle ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-400">Department:</span>
                <span className="text-white">{profile?.department ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-400">Phone:</span>
                <span className="text-white">{profile?.phone ?? "—"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Training Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-indigo-400" /> Training Summary
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Overall Completion</span>
          <span className="text-indigo-400 font-bold">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-xl font-bold text-green-400">{completed}</div>
            <div className="text-xs text-gray-500 mt-0.5">Completed</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-xl font-bold text-yellow-400">
              {myProgress.filter((p) => p.status === "in_progress").length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">In Progress</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-3">
            <div className="text-xl font-bold text-gray-400">
              {Math.max(0, modules.length - myProgress.length)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Not Started</div>
          </div>
        </div>

        {/* Completed modules list */}
        {myProgress.filter((p) => p.status === "completed").length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Completed Modules</p>
            {myProgress
              .filter((p) => p.status === "completed")
              .map((p) => {
                const mod = modules.find((m) => m._id === p.moduleId);
                return (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400" />
                      <span className="text-gray-300">{mod?.title ?? "Module"}</span>
                    </div>
                    {p.score !== undefined && (
                      <span className="text-green-400 font-medium text-xs">{p.score}%</span>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
