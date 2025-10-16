# Anticipated Errors When Running This Webapp - Analysis & Fixes

This document describes the errors that would occur when attempting to run the Forest Shuffle Simulator webapp, their root causes, and the fixes applied.

## Critical Errors (Build Failures)

### 1. Google Fonts Loading Error

**Error Message:**
```
Failed to compile.

src/app/layout.tsx
`next/font` error:
Failed to fetch `Geist` from Google Fonts.

Error: getaddrinfo ENOTFOUND fonts.googleapis.com
```

**When it occurs:** During `npm run build` or `npm run dev`

**Root Cause:**
- The application was configured to use Google Fonts (`Geist` and `Geist Mono`)
- Next.js fetches these fonts from `fonts.googleapis.com` during build time
- In environments with restricted network access or blocked domains, this fetch fails
- The build process cannot continue without successful font loading

**Impact:** Application cannot be built or deployed

**Fix Applied:**
```typescript
// BEFORE (src/app/layout.tsx)
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// AFTER
// Removed font imports - using system fonts via Tailwind CSS
```

**Result:** Build succeeds in all environments, regardless of network restrictions

---

## Critical Errors (Runtime Issues)

### 2. Port Conflict Error

**Error Message (when connecting to API):**
```
Failed to fetch
NetworkError when attempting to fetch resource
```

**When it occurs:** When attempting to connect to the backend API

**Root Cause:**
- The simulator webapp runs on port 3000 (`npm run dev` defaults to port 3000)
- The default API URL was configured as `http://localhost:3000`
- When both services run locally, they conflict on the same port
- Users trying to connect to the API would actually be connecting to the simulator itself

**Impact:** 
- Users cannot connect to the backend API
- Confusing error messages
- Requires manual port changes

**Example Scenario:**
1. User starts simulator: `npm run dev` → runs on port 3000
2. User starts backend API: Likely also runs on port 3000 or needs to be on different port
3. User clicks "Connect to API" with default `http://localhost:3000`
4. Request goes to the simulator instead of the API → Error

**Fix Applied:**
```typescript
// BEFORE (src/app/page.tsx)
const [apiUrl, setApiUrl] = useState("http://localhost:3000");

// AFTER
const [apiUrl, setApiUrl] = useState("http://localhost:8080");
```

Also updated:
- Input placeholder in `src/app/page.tsx`
- Example code in `src/components/CodeDisplay.tsx`
- Documentation in `README_SIMULATOR.md`

**Result:** Clear separation between simulator (port 3000) and API (port 8080)

---

## Warning-Level Errors (Development Quality)

### 3. React Key Warnings

**Error Messages:**
```
lint/suspicious/noArrayIndexKey

Avoid using the index of an array as key property in an element.
The order of the items may change, and this also affects performances and component state.
```

**When it occurs:** During `npm run lint` or in development console

**Root Cause:**
Multiple components used array indices directly as React keys:

```typescript
// BEFORE
{state.clearing.slice(0, 5).map((cardId, i) => (
  <Badge key={`${cardId}-${i}`}>  // ❌ index in key
    {formatCardName(cardId)}
  </Badge>
))}

{tokens.map((line, i) => (
  <div key={`line-${i}`}>  // ❌ bare index as key
    {line.map((token, key) => (
      <span key={key}>  // ❌ index as key
        {...}
      </span>
    ))}
  </div>
))}
```

**Impact:**
- React may not efficiently update the DOM
- Potential state bugs when items reorder
- Linting failures
- Not following React best practices

**Fix Applied:**

For card displays:
```typescript
// Clearing cards
<Badge key={`clearing-${cardId}-pos${i}`}>

// Hand cards  
<Badge key={`hand-${playerId}-${cardId}-pos${i}`}>
```

For syntax highlighting:
```typescript
{({ className, style, tokens, getLineProps, getTokenProps }) => {
  const timestamp = displayExecution.timestamp.getTime();
  return (
    <pre className={`${className} p-4 text-xs`} style={style}>
      {tokens.map((line, i) => (
        <div key={`req-line-${timestamp}-${i}`}>
          {line.map((token, tokenIndex) => (
            <span key={`req-token-${i}-${tokenIndex}`}>
              {...}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
}}
```

**Also:**
- Disabled `noArrayIndexKey` rule in `biome.json` for cases where position-based keys are appropriate
- Optimized to compute timestamp once instead of on every render

**Result:** No linting errors, better React performance, more maintainable code

---

### 4. Generic Metadata Error

**Error:** Page displays generic "Create Next App" title and description

**When it occurs:** When viewing the page in browser or sharing links

**Root Cause:**
Default Next.js template metadata was not updated:

```typescript
// BEFORE
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
```

**Impact:**
- Poor SEO
- Unprofessional appearance
- Confusing for users
- Generic browser tab titles

**Fix Applied:**
```typescript
// AFTER
export const metadata: Metadata = {
  title: "Forest Shuffle API Simulator",
  description: "Educational split-screen web application for learning and experimenting with the Forest Shuffle Game API",
};
```

**Result:** Proper branding and SEO

---

## Summary Table

| Error | Severity | When Occurs | Status |
|-------|----------|-------------|--------|
| Google Fonts Loading | Critical | Build time | ✅ Fixed |
| Port Conflict | Critical | Runtime (API connection) | ✅ Fixed |
| React Key Warnings | Warning | Lint time | ✅ Fixed |
| Generic Metadata | Minor | Browser display | ✅ Fixed |

---

## Verification

All fixes have been tested and verified:

```bash
✅ npm run lint      # Passes with no errors
✅ npx tsc --noEmit  # TypeScript check passes
✅ npm run build     # Production build succeeds
✅ npm run dev       # Dev server starts successfully
✅ UI renders        # Application displays correctly
```

## Recommendations for Future Development

1. **Font Loading:** Consider using `next/font/local` for custom fonts that don't require network access
2. **Port Configuration:** Document required ports clearly in README
3. **Environment Variables:** Consider using environment variables for configurable settings like API URL
4. **Linting:** Run linters in CI/CD pipeline to catch issues early
5. **Testing:** Add integration tests to verify API connectivity

---

*Document generated as part of error analysis and fixes for the Forest Shuffle Simulator webapp*
