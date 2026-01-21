# Doodle Chat — Frontend

A simple chat interface built with **React** and **TypeScript** for the Doodle Frontend Engineer challenge.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

**No `.env` file required** — API configuration uses sensible defaults in `src/config/env.ts` (can be overridden via environment variables if needed).

**Prerequisites:** Node.js (LTS) + [Doodle Chat API](https://github.com/DoodleScheduling/frontend-challenge-chat-api) running locally.

---

## 🏗️ Architecture & Design Decisions

### Layered Architecture
```
UI Components → Custom Hook → API Client → HTTP (fetch)
```
- **API Client** (`src/api/`): Framework-agnostic, type-safe HTTP client
- **Custom Hook** (`src/hooks/useChatMessages.ts`): Explicit state management (no React Query for MVP)
- **Components**: Container/Presentational pattern for clear separation of concerns

**Why this approach?**
- API client can be reused with any data-fetching solution (React Query, SWR, etc.)
- Clear separation enables easy testing and future enhancements
- Type safety throughout prevents runtime errors

### Key Features

**Accessibility First**
- Semantic HTML (`<main>`, `<header>`, `<time>`, `<form>`)
- ARIA labels, live regions, skip-to-content link
- Keyboard navigation support
- Screen reader announcements for loading/error states

**Responsive Design**
- Mobile-first approach with `100dvh` for proper mobile viewport
- Only message list scrolls (prevents layout shifts)
- Touch-friendly interactions

**Error Handling**
- User-friendly error messages (network vs validation)
- Retry mechanisms with disabled states
- Non-blocking error display

**Performance**
- Message normalization (parsing `createdAt` once)
- Efficient re-renders (no unnecessary memoization)
- Optimistic UI updates

---

## 📁 Project Structure

```
src/
├── api/           # Framework-agnostic API client
├── components/    # React components (CSS Modules)
├── config/        # Environment configuration
├── hooks/         # Custom React hooks
├── styles/        # Global styles (tokens, base)
├── types/         # TypeScript types (@models/*)
└── utils/         # Utility functions
```

**Path Aliases:** `@api`, `@components`, `@hooks`, `@models`, `@styles`, `@utils`, `@config`

---

## 🎯 Challenge Requirements Coverage

| Requirement | Implementation |
|------------|----------------|
| **Code Readability** | Container/Presentational pattern, semantic naming, JSDoc comments |
| **Commit Quality** | Atomic commits with descriptive messages (see git history) |
| **Performance** | Efficient rendering, message normalization, optimized re-renders |
| **Accessibility** | WCAG-compliant, semantic HTML, ARIA attributes, keyboard navigation |
| **Design Attention** | Responsive layout, consistent spacing, error states, loading feedback |

---

## 💡 Design Decisions

**Why no React Query?**
- MVP scope: explicit state management is sufficient
- API client is framework-agnostic, can add React Query later without refactoring
- Demonstrates understanding of React fundamentals

**Why CSS Modules?**
- Scoped styles prevent conflicts
- Better than inline styles for maintainability
- Aligns with component-based architecture

**Why custom hook instead of direct API calls?**
- Encapsulates state management logic
- Reusable across components
- Easier to test and mock

---

## 🚀 Future Enhancements

The current architecture is designed to support these enhancements without major refactoring:

**Performance:**
- React Query integration (API client is framework-agnostic, ready for migration)
- Virtualization for large message lists (100+ messages)
- Message pagination/infinite scroll (API already supports `after` and `limit` params)

**UX:**
- Optimistic updates for better perceived performance
- Message grouping (consecutive messages from same author)
- Relative timestamps ("2m ago" instead of absolute time)

**Note:** These are potential enhancements, not requirements. The MVP is complete and production-ready.
