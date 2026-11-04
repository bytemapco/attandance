# 🎨 Frontend Dashboard — Next.js 16 + React 19

**Service:** SAHAJ Web Dashboard  
**Technology:** Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript  
**Entry Point:** `src/app`  
**Dev Server:** http://localhost:3000

---

## 📂 Directory Structure

```
frontend/
├── src/
│   ├── app/                         # ✅ Next.js App Router (pages & routes)
│   │   ├── (auth)/                  → Public routes (login, signup)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── layout.tsx           → Public layout (no sidebar)
│   │   │
│   │   ├── (dashboard)/             → Protected routes (require auth)
│   │   │   ├── layout.tsx           → Main layout (sidebar + header)
│   │   │   ├── page.tsx             → Dashboard home
│   │   │   ├── admin/
│   │   │   │   ├── class-management/
│   │   │   │   │   ├── page.tsx      → Classes list
│   │   │   │   │   ├── [id]/page.tsx → Class detail
│   │   │   │   │   └── [id]/modal.tsx
│   │   │   │   ├── teachers/
│   │   │   │   ├── students/
│   │   │   │   ├── audit-logs/
│   │   │   │   ├── departments/
│   │   │   │   └── settings/
│   │   │   ├── teacher/
│   │   │   │   ├── attendance/
│   │   │   │   ├── classes/
│   │   │   │   └── analytics/
│   │   │   └── student/
│   │   │       ├── mark-attendance/
│   │   │       ├── history/
│   │   │       └── profile/
│   │   │
│   │   ├── api/                     → Route handlers (proxies & webhooks)
│   │   │   ├── auth/[...slug]/route.ts    → Auth endpoints
│   │   │   ├── attendance/[...slug]/route.ts
│   │   │   └── webhook/[...slug]/route.ts
│   │   │
│   │   ├── app.css                  → Global styles
│   │   └── layout.tsx               → Root layout
│   │
│   ├── components/                  # ✅ Reusable UI Components (Glass Design System)
│   │   ├── ui/
│   │   │   ├── button.tsx           → GlassButton, variants
│   │   │   ├── input.tsx            → GlassInput, textarea
│   │   │   ├── card.tsx             → GlassCard
│   │   │   ├── modal.tsx            → GlassModal
│   │   │   ├── sheet.tsx            → Bottom sheet
│   │   │   ├── table.tsx            → Data table with sorting
│   │   │   ├── select.tsx           → Dropdown
│   │   │   ├── badge.tsx            → Status badge
│   │   │   ├── tooltip.tsx          → Hover tooltips
│   │   │   └── spinner.tsx          → Loading indicator
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx          → Main navigation
│   │   │   ├── header.tsx           → Top bar
│   │   │   ├── breadcrumb.tsx       → Navigation path
│   │   │   └── footer.tsx           → App footer
│   │   │
│   │   ├── forms/
│   │   │   ├── login-form.tsx
│   │   │   ├── student-form.tsx
│   │   │   ├── class-form.tsx
│   │   │   ├── attendance-form.tsx
│   │   │   └── filter-form.tsx      → Dynamic filters
│   │   │
│   │   ├── dialogs/
│   │   │   ├── confirm-dialog.tsx   → Delete/archive confirmations
│   │   │   ├── import-dialog.tsx    → Bulk import
│   │   │   └── export-dialog.tsx    → CSV/Excel export
│   │   │
│   │   ├── admin/
│   │   │   ├── class-management/
│   │   │   │   ├── ClassList.tsx    → Table view
│   │   │   │   ├── ClassDetail.tsx  → Detail page
│   │   │   │   ├── CreateClassDialog.tsx
│   │   │   │   └── StudentsTab.tsx
│   │   │   ├── StudentsTab.tsx
│   │   │   ├── DashboardMetrics.tsx
│   │   │   └── AuditLogTable.tsx
│   │   │
│   │   └── common/
│   │       ├── empty-state.tsx      → No data placeholder
│   │       ├── error-boundary.tsx   → Error fallback
│   │       └── loading-skeleton.tsx → Content skeleton
│   │
│   ├── hooks/                       # ✅ Custom React Hooks
│   │   ├── use-query-params.ts      → URL search params
│   │   ├── use-debounce.ts          → Debounce input
│   │   ├── use-pagination.ts        → Pagination state
│   │   ├── use-table-sort.ts        → Table sorting
│   │   ├── use-api.ts               → API call wrapper
│   │   ├── use-local-storage.ts     → Persistent state
│   │   ├── use-window-size.ts       → Responsive queries
│   │   └── use-notification.ts      → Toast notifications
│   │
│   ├── lib/                         # ✅ Utilities & API Clients
│   │   ├── api.ts                   → Axios client + interceptors
│   │   ├── api-endpoints.ts         → URL constants
│   │   ├── validators.ts            → Zod schemas for validation
│   │   ├── utils.ts                 → Helper functions
│   │   ├── constants.ts             → Magic numbers, enums
│   │   └── types.ts                 → TypeScript interfaces
│   │
│   ├── store/                       # ✅ Zustand State Stores
│   │   ├── auth.store.ts            → User, token, auth state
│   │   ├── theme.store.ts           → Dark/light mode
│   │   └── ui.store.ts              → Sidebar collapsed, modals
│   │
│   └── tests/                       # ✅ Vitest Unit Tests (31 tests)
│       ├── setup.ts                 → Test configuration
│       ├── fixtures.ts              → Mock data
│       ├── hooks/
│       ├── components/
│       └── lib/
│
├── public/                          → Static assets (images, icons)
│   ├── images/
│   └── icons/
│
├── package.json                     → Dependencies & scripts
├── tsconfig.json                    → TypeScript config (strict mode)
├── tailwind.config.ts               → Tailwind customization
├── vitest.config.ts                 → Test runner config
├── next.config.js                   → Next.js config
├── .env.local                       → Local environment vars
└── .env.example                     → Template for contributors
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup (First Time)

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your API endpoint

# 3. Start development server
npm run dev
# Dashboard available at http://localhost:3000

# 4. Run tests
npm test
```

### Available Scripts

```bash
npm run dev           # Start Next.js dev server with auto-reload
npm test              # Run Vitest unit tests
npm run build         # Build for production
npm run lint          # Run ESLint on all files
npm run type-check    # TypeScript strict check
npm run start         # Run production build locally
```

---

## 🏛️ Architecture Layers

### 1️⃣ Routes Layer (`src/app/`)
**Responsibility:** Page layout, server-side logic, route structure

**Next.js App Router Pattern:**
```tsx
// src/app/(dashboard)/admin/class-management/page.tsx
import { Metadata } from "next";
import { ClassListPage } from "@/components/admin/class-management";

export const metadata: Metadata = {
  title: "Class Management",
};

export default function Page() {
  return <ClassListPage />;
}
```

**Rules:**
- ✅ Use App Router (not Pages Router)
- ✅ Group related routes with `(group)` folders
- ✅ Protect routes with middleware (auth check)
- ✅ Use Server Components for static content
- ✅ Use `"use client"` only in interactive components
- ❌ No business logic in route files

---

### 2️⃣ Components Layer (`src/components/`)
**Responsibility:** Reusable UI elements, composable parts

**Component Pattern:**
```tsx
// src/components/ui/button.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function GlassButton({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg font-medium transition",
        variant === "primary" && "bg-orange-600 text-white hover:bg-orange-700",
        variant === "secondary" && "bg-slate-200 text-slate-900 hover:bg-slate-300",
        size === "md" && "px-4 py-2 text-base",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
```

**Component Guidelines:**
- ✅ Composable & single-responsibility
- ✅ Typed props with TypeScript interfaces
- ✅ Use Tailwind CSS for styling
- ✅ Mark with `"use client"` if interactive
- ✅ Handle dark mode with `dark:` classes
- ✅ Keep under 150 lines (split if larger)
- ❌ No API calls in UI components
- ❌ No hardcoded domain logic

---

### 3️⃣ Hooks Layer (`src/hooks/`)
**Responsibility:** Stateful logic, API integration, side effects

**Hook Pattern:**
```typescript
// src/hooks/use-api.ts
"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>(
  endpoint: string,
  options?: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (method = "GET", body?: any) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api({
          method,
          url: endpoint,
          data: body,
        });
        setData(response.data);
        options?.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, options]
  );

  return { data, isLoading, error, execute };
}
```

**Common Hooks:**
- `use-api.ts` → API call wrapper
- `use-debounce.ts` → Debounce input (search)
- `use-pagination.ts` → Pagination state
- `use-table-sort.ts` → Table sorting & filtering
- `use-local-storage.ts` → Persistent state
- `use-window-size.ts` → Responsive breakpoints

---

### 4️⃣ Library Layer (`src/lib/`)
**Responsibility:** Utilities, API clients, validation

**API Client Pattern:**
```typescript
// src/lib/api.ts
import axios from "axios";
import { authStore } from "@/store/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const success = await authStore.getState().refreshToken();
      if (success) {
        return api.request(error.config);
      }
      // Redirect to login
      authStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

**Validation Pattern (Zod):**
```typescript
// src/lib/validators.ts
import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// In a form:
const [errors, setErrors] = useState<Record<string, string>>({});
const handleSubmit = (formData: LoginInput) => {
  const result = LoginSchema.safeParse(formData);
  if (!result.success) {
    setErrors(result.error.flatten().fieldErrors);
    return;
  }
  // Submit...
};
```

---

### 5️⃣ Store Layer (`src/store/`)
**Responsibility:** Global UI & auth state (not API data)

**Zustand Pattern:**
```typescript
// src/store/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.post("/auth/login", { email, password });
        set({
          user: response.data.user,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        try {
          const response = await api.post("/auth/refresh");
          set({ accessToken: response.data.access_token });
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

---

### 6️⃣ Tests Layer (`src/tests/`)
**Responsibility:** Unit tests with Vitest

**Test Pattern:**
```typescript
// src/tests/hooks/use-debounce.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";

describe("useDebounce", () => {
  it("should debounce value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial");

    await waitFor(
      () => expect(result.current).toBe("updated"),
      { timeout: 600 }
    );
  });
});
```

---

## 🎨 Glass Design System

The frontend uses the **Glass Design System** with:

**Colors:**
- Primary: `#F95721` (warm orange)
- Dark Canvas: `#0F172A`
- Surfaces: `#1E293B`
- Text: `#F8FAFC` (light)

**Typography:**
- Font: `Plus Jakarta Sans` (Google Fonts)
- Headings: `font-weight: 600` (w600)
- Body: `font-weight: 400-500` (w400/w500)

**Components:**
- Glass effect: `backdrop-blur` + `bg-white/10`
- Rounded: `rounded-lg` (8px)
- Spacing: 8px grid (`px-2`, `py-1`, etc.)

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test hooks/use-debounce

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Structure

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { GlassButton } from "@/components/ui/button";

describe("GlassButton", () => {
  it("should render button with text", () => {
    render(<GlassButton>Click me</GlassButton>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should be disabled while loading", () => {
    render(<GlassButton isLoading>Loading</GlassButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

---

## 🔒 Authentication Flow

1. User logs in via `/login` page
2. Credentials sent to `POST /auth/login` backend
3. Response includes `access_token` + `refresh_token`
4. Tokens stored in `authStore` (Zustand) + localStorage
5. API client injects token in `Authorization` header
6. On 401, middleware triggers token refresh
7. If refresh fails, redirect to login

---

## 🔄 API Integration Pattern

```typescript
// 1. Define types
interface Student {
  id: string;
  email: string;
  name: string;
}

// 2. Create API function
async function fetchStudents(tenantId: string): Promise<Student[]> {
  const response = await api.get(`/admin/students`, {
    params: { tenantId },
  });
  return response.data;
}

// 3. Use in component
"use client";

import { useEffect, useState } from "react";
import { fetchStudents } from "@/lib/api";

export function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents("t1")
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {students.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
}
```

---

## 📋 Environment Variables

Create `.env.local`:

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature flags
NEXT_PUBLIC_ENABLE_BIOMETRIC=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## 🛠️ Common Tasks

```bash
# Add new component
touch src/components/my-component.tsx

# Add new page
mkdir -p src/app/(dashboard)/my-page
touch src/app/(dashboard)/my-page/page.tsx

# Add new hook
touch src/hooks/use-my-hook.ts

# Type check
npm run type-check

# Format code
npm run lint -- --fix
```

---

## 📞 Support

- **UI Rules** → `/AGENTS.md`
- **Architecture** → `/docs/ARCHITECTURE.md`
- **Development Rules** → `/CLAUDE.md` (§1-§5)
- **Code Patterns** → Look at similar components in `src/components/`
- **API Endpoints** → Backend Swagger docs at http://localhost:8000/docs

---

**Happy coding! 🎨**
