# AI Copilot Instructions for Oposiciones Management System

## Project Overview
This is a **React + TypeScript + Vite** web application for managing exam opposition processes ("oposiciones"), corrections, and revisions. The app uses a dark-themed modern UI (Ant Design + Tailwind CSS + Shadcn/ui) with Framer Motion animations.

### Key Architecture
- **Authentication Flow**: Login → Dashboard (conditional render via AuthContext)
- **UI Pattern**: Component-based with page-level navigation in Dashboard using state
- **Styling**: Tailwind + Ant Design tokens (dark theme with purple primary color `#7c3aed`)
- **API Communication**: Axios instance in `src/config/api.ts` with request/response interceptors

## Critical Architecture Patterns

### Authentication & Authorization
- **AuthContext** (`src/context/AuthContext.tsx`): Manages user state globally
  - User data stored in cookies via `setCookie()`
  - Roles: `PROFESOR` (teacher) or `ESTUDIANTE` (student)
  - Always check `useAuth()` for permission gating before rendering role-specific content
- **authService** (`src/services/authService.ts`): Handles login/logout, cookie persistence
  - Login endpoint: `POST /login` (email, password) → returns user array
  - No JWT token management visible; session is cookie-based

### Service Layer Structure
All API calls use singleton service objects in `src/services/`:
- `authService` - Login/logout, user state
- `oposicionesService` - Fetch, filter oposiciones (exam opportunities)
- `revisionesService` - Review status and operations
- `correccionesService` - Exam corrections management
- `temariosService` - Syllabus/curriculum resources

**Pattern**: Services return Promises; use React Query for caching (`@tanstack/react-query`).

### Component Hierarchy
```
OpoApp (theme config + AuthProvider)
└── AppContent (auth-gated switch)
    ├── Login (if !isAuthenticated)
    └── Dashboard (if isAuthenticated)
        ├── Header (navigation, currentPage state)
        └── [Oposiciones | Revisiones | Correcciones | Temarios] (animated pages)
```

### Data Flow Pattern
- Services fetch from API → Components consume via hooks
- **Navigation State**: Dashboard uses `currentPage` state (string) to switch pages
- **Form Validation**: React Hook Form + Zod (configured but examples not found in analyzed files)
- **Notifications**: Sonner toast component for alerts

## Project-Specific Conventions

### Naming & File Organization
- Components in `src/components/{Feature}/` with `.tsx` + `.css` pair
- Shared UI primitives in `src/components/ui/` (shadcn/ui pre-built components)
- Page routing logic in `src/pages/` (currently minimal - main routing is dashboard-internal)
- Services are classes/objects with `export const serviceName = { ... }` pattern

### Styling Conventions
- **Tailwind-first**: Use Tailwind utilities for layout and responsive design
- **Ant Design tokens**: Override via ConfigProvider in `OpoApp.tsx` (dark theme with purple accent)
- **CSS modules**: Component-specific styles in `.css` files (e.g., `Dashboard.css`)
- **Animations**: Framer Motion for page transitions (see `pageVariants` in Dashboard)

### Environment & Configuration
- API base URL: `VITE_REACT_API_BASE_URL` environment variable (required)
- API instance in `src/config/api.ts` includes:
  - Timeout: 10000ms
  - 401 response → redirect to `/` (auto-logout on token expiry)

### Type Definitions Pattern
- Core types in `src/types/index.ts`:
  - `User` (with `rol: 'PROFESOR' | 'ESTUDIANTE'`)
  - `Oposicion` (exam opportunity with status: abierta|cerrada|proxima)
  - `TemaTemario` (curriculum with resources)
  - Reusable interfaces, not heavy inheritance

## Development Workflow

### Build & Run Commands
- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - Production build with optimizations
- `npm run build:dev` - Development build (useful for debugging)
- `npm run lint` - ESLint check
- `npm run preview` - Serve built app locally

### Expected Development Patterns
1. **Add a new page**: Create `src/components/{Feature}/{Feature}.tsx`, add case to Dashboard switch
2. **Add API calls**: Extend service in `src/services/`, import in component, use with React Query
3. **Add form**: Use React Hook Form + Zod, integrate into component with Shadcn/ui or Ant Design form
4. **Styling**: Combine Tailwind classes + Ant Design tokens (dark theme pre-configured)

## Integration Points & External Dependencies

### Critical Dependencies
- **React Router**: Not currently routing at page level (all via Dashboard state) — if adding true routing, update Index.tsx
- **React Query**: Set up in `App.tsx` with QueryClientProvider; use for API data caching
- **Ant Design**: Dark theme configured globally; components available in `src/components/ui/`
- **Framer Motion**: Page animations with `motion.div`, `AnimatePresence`
- **Axios Interceptors**: 401 response auto-redirects; add auth headers in request interceptor if needed

### API Response Structure
- **Login response**: Array of objects with keys: `profesor_id`, `usuario_id`, `nombre`, `email`, `rol_base`, `tipo_acceso`
- Other endpoints: Check service implementations for expected response shapes
- All requests use `api` instance from `src/config/api.ts`

## Common Pitfalls & Best Practices

1. **Authentication Check**: Always wrap pages/features with `useAuth()` check; lazy load based on `isAuthenticated`
2. **Cookie Persistence**: User survives page refresh via `authService.getCurrentUser()` in AuthContext useEffect
3. **Page Transitions**: Use `AnimatePresence` + variants for consistent animations (see Dashboard pattern)
4. **Role-Based Access**: Check `isProfesor` boolean from `useAuth()` before rendering sensitive features
5. **API Errors**: 401 errors trigger auto-redirect; handle 4xx/5xx in component error boundaries if needed
6. **Dark Theme**: All Ant Design components inherit dark algorithm; custom dark styling uses tailwind `dark:` classes if needed

## Key Files Reference
- **App Entry**: `src/main.tsx` → `src/OpoApp.tsx`
- **Auth Context**: `src/context/AuthContext.tsx` (provides `useAuth()`)
- **API Config**: `src/config/api.ts` (axios instance with interceptors)
- **Services**: `src/services/index.ts` (exports all service objects)
- **Types**: `src/types/index.ts` (User, Oposicion, etc.)
- **Dashboard**: `src/components/Dashboard/Dashboard.tsx` (main app layout with page routing)
