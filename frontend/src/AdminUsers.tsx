import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Users, Shield, UserCheck, UserX, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

export function AdminUsers() {
  const users = useQuery(api.userProfiles.getAllUsers) ?? [];
  const setUserRole = useMutation(api.userProfiles.setUserRole);
  const toggleActive = useMutation(api.userProfiles.toggleUserActive);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "employee" | "admin">("all");

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRoleChange = async (userId: Id<"users">, role: "employee" | "admin") => {
    try {
      await setUserRole({ targetUserId: userId, role });
      toast.success(`Role updated to ${role}`);
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleToggleActive = async (userId: Id<"users">, currentlyActive: boolean) => {
    try {
      await toggleActive({ targetUserId: userId });
      toast.success(currentlyActive ? "User deactivated" : "User activated");
    } catch {
      toast.error("Failed to update user status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-gray-400 text-sm mt-1">Manage roles and access for all users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "employee", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                roleFilter === r ? "bg-purple-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{users.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-400">{users.filter((u) => u.isActive).length}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{users.filter((u) => u.role === "admin").length}</div>
          <div className="text-xs text-gray-500">Admins</div>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <Users size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No users found</p>
          </div>
        ) : (
          filtered.map((user) => (
            <div key={user._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  user.role === "admin" ? "bg-purple-600" : "bg-indigo-600"
                } text-white`}>
                  {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white truncate">{user.name ?? user.email ?? "Unknown"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      user.role === "admin"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-green-500/20 text-green-400 border-green-500/30"
                    }`}>
                      {user.role}
                    </span>
                    {!user.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {user.email} {user.department ? `· ${user.department}` : ""} {user.jobTitle ? `· ${user.jobTitle}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(user.userId, user.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      user.isActive
                        ? "text-green-400 hover:bg-red-900/30 hover:text-red-400"
                        : "text-gray-500 hover:bg-green-900/30 hover:text-green-400"
                    }`}
                    title={user.isActive ? "Deactivate user" : "Activate user"}
                  >
                    {user.isActive ? <UserCheck size={16} /> : <UserX size={16} />}
                  </button>
                  <div className="relative group">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors">
                      <Shield size={12} /> Role <ChevronDown size={10} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 hidden group-hover:block min-w-[120px]">
                      {(["employee", "admin"] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(user.userId, role)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors capitalize first:rounded-t-lg last:rounded-b-lg ${
                            user.role === role ? "text-indigo-400 font-medium" : "text-gray-300"
                          }`}
                        >
                          {role === "admin" ? "🛡️" : "👤"} {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
