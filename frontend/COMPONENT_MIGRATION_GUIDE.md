# Component Migration Guide - From Convex to Supabase

This guide shows how to update React components from Convex to Supabase.

## Pattern 1: Reading Data

### Before (Convex)
```jsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function TrainingList() {
  const modules = useQuery(api.training.getModules);

  if (!modules) return <div>Loading...</div>;

  return (
    <div>
      {modules.map(m => (
        <div key={m._id}>{m.title}</div>
      ))}
    </div>
  );
}
```

### After (Supabase)
```jsx
import { useEffect, useState } from "react";
import { getTrainingModules } from "@/services/trainingModuleService";

export function TrainingList() {
  const [modules, setModules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrainingModules()
      .then(setModules)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {modules?.map(m => (
        <div key={m.id}>{m.title}</div>
      ))}
    </div>
  );
}
```

## Pattern 2: Creating Data

### Before (Convex)
```jsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CreateThreatReport() {
  const createReport = useMutation(api.threats.create);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createReport({
      title,
      description,
      severity: "high",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### After (Supabase)
```jsx
import { useState } from "react";
import { createThreatReport } from "@/services/threatReportService";
import { getCurrentUser } from "@/services/authService";

export function CreateThreatReport() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      await createThreatReport(user.id, {
        title,
        description,
        severity: "high",
      });
      // Reset form
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
    </form>
  );
}
```

## Pattern 3: Updating Data

### Before (Convex)
```jsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UpdateProgress({ userId, moduleId }) {
  const updateProgress = useMutation(api.training.updateProgress);

  const handleComplete = async (score) => {
    await updateProgress({
      userId,
      moduleId,
      status: "completed",
      score,
    });
  };

  return <button onClick={() => handleComplete(95)}>Mark Complete</button>;
}
```

### After (Supabase)
```jsx
import { useState } from "react";
import { updateTrainingProgress } from "@/services/trainingProgressService";

export function UpdateProgress({ userId, moduleId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleComplete = async (score) => {
    setLoading(true);
    setError(null);

    try {
      await updateTrainingProgress(userId, moduleId, {
        status: "completed",
        score,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button 
        onClick={() => handleComplete(95)}
        disabled={loading}
      >
        {loading ? "Saving..." : "Mark Complete"}
      </button>
    </div>
  );
}
```

## Pattern 4: Authentication

### Before (Convex)
```jsx
import { SignInForm } from "@/components/SignInForm";
import { useConvexAuth, SignOutButton } from "convex/react";
import { UserButton } from "@convex-dev/auth/react";

export function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) return <div>Loading...</div>;

  return isAuthenticated ? (
    <div>
      <UserButton />
      {/* App content */}
    </div>
  ) : (
    <SignInForm />
  );
}
```

### After (Supabase)
```jsx
import { useEffect, useState } from "react";
import { onAuthStateChange, getCurrentUser, signOut } from "@/services/authService";
import { SignInForm } from "@/components/SignInForm";

export function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // Listen for auth changes
    const { data } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return user ? (
    <div>
      <div>{user.email}</div>
      <button onClick={signOut}>Sign Out</button>
      {/* App content */}
    </div>
  ) : (
    <SignInForm />
  );
}
```

## Pattern 5: Real-time Data (Subscriptions)

### Before (Convex)
```jsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function NotificationsPanel({ userId }) {
  // Convex handles real-time automatically
  const notifications = useQuery(api.notifications.getAll, { userId });

  return (
    <div>
      {notifications?.map(n => (
        <div key={n._id}>{n.message}</div>
      ))}
    </div>
  );
}
```

### After (Supabase)
```jsx
import { useEffect, useState } from "react";
import { getUserNotifications, subscribeToNotifications } from "@/services/notificationService";

export function NotificationsPanel({ userId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load initial notifications
    getUserNotifications(userId).then(setNotifications);

    // Subscribe to real-time updates
    const subscription = subscribeToNotifications(userId, (payload) => {
      if (payload.eventType === "INSERT") {
        setNotifications(prev => [payload.new, ...prev]);
      } else if (payload.eventType === "UPDATE") {
        setNotifications(prev =>
          prev.map(n => n.id === payload.new.id ? payload.new : n)
        );
      } else if (payload.eventType === "DELETE") {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      }
    });

    return () => subscription.unsubscribe();
  }, [userId]);

  return (
    <div>
      {notifications.map(n => (
        <div key={n.id}>{n.message}</div>
      ))}
    </div>
  );
}
```

## Pattern 6: Filtering and Searching

### Before (Convex)
```jsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UsersList({ role }) {
  const users = useQuery(api.users.listByRole, { role });

  return (
    <div>
      {users?.map(u => (
        <div key={u._id}>{u.name}</div>
      ))}
    </div>
  );
}
```

### After (Supabase)
```jsx
import { useEffect, useState } from "react";
import { getAllUsers } from "@/services/userProfileService";

export function UsersList({ role }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers({ role })
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {users.map(u => (
        <div key={u.id}>{u.job_title}</div>
      ))}
    </div>
  );
}
```

## Key Differences Summary

| Aspect | Convex | Supabase |
|--------|--------|----------|
| **Queries** | `useQuery()` hook | Custom fetch + `useState()` |
| **Mutations** | `useMutation()` hook | Direct function calls + state management |
| **Real-time** | Automatic | Manual subscriptions |
| **ID Fields** | `_id` (string) | `id` (UUID) |
| **Timestamps** | `_creationTime` | `created_at`, `updated_at` |
| **Authentication** | Convex Auth | Supabase Auth |
| **Error Handling** | Built-in | Manual try/catch |
| **Loading States** | Built-in | Manual with `useState()` |

## Migration Checklist

When updating each component:

- [ ] Replace all `useQuery()` calls with service functions + `useState()`
- [ ] Replace all `useMutation()` calls with service functions
- [ ] Update ID field references: `_id` → `id`
- [ ] Update timestamp references: `_creationTime` → `created_at`
- [ ] Handle loading states manually with `useState()`
- [ ] Handle errors with try/catch blocks
- [ ] Update authentication logic
- [ ] Convert real-time queries to subscriptions
- [ ] Update imports to use new services
- [ ] Test thoroughly in development

## Tips

1. **Start with read-only operations** - They're simpler to migrate
2. **Create custom hooks** - Wrap service calls in hooks to reduce boilerplate
3. **Use TypeScript** - Add types to service functions for better DX
4. **Test authentication first** - Make sure auth works before other features
5. **Use Supabase dashboard** - Verify data is being saved correctly

## Example Custom Hook

```jsx
// hooks/useTrainingModules.js
import { useEffect, useState } from "react";
import { getTrainingModules } from "@/services/trainingModuleService";

export function useTrainingModules(filters) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getTrainingModules(filters)
      .then(setModules)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { modules, loading, error };
}

// Usage
function MyComponent() {
  const { modules, loading, error } = useTrainingModules({ category: "phishing" });
  // ...
}
```

This approach reduces code duplication and makes components cleaner.
