# Frontend Design Patterns - Advanced Analysis

## Overview

While the frontend doesn't implement the classic Gang of Four design patterns in the same way as the backend, it uses several **React-specific and web-specific design patterns** that are equally important for maintainable, scalable applications.

---

## 🎯 Classic Design Patterns (Adapted for React)

### 1. **Observer Pattern** (React Context API + Custom Hooks)

**Location**: `auth-context.tsx`, `use-goal-notifications.ts`

**Implementation**:
```typescript
// auth-context.tsx - Provider (Subject)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Notify all subscribers when user state changes
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Any component (Observer)
export function useAuth() {
  const context = useContext(AuthContext);
  // Component automatically re-renders when user state changes
  return context;
}
```

**Why it's Observer Pattern**:
- **Subject**: `AuthProvider` holds the state
- **Observers**: Components using `useAuth()` hook
- **Notification**: React's built-in re-rendering mechanism notifies observers
- **Decoupling**: Components don't need to know about each other

**Real-world Benefit**: When user logs in, all components displaying user info automatically update without manual notification.

---

### 2. **Adapter Pattern** (API Client)

**Location**: `lib/api-client.ts`

**Implementation**:
```typescript
// Adapts fetch API to typed, domain-specific interface
export const analyzeAndLogDish = async (
  file: File,
  mealType: string,
  token?: string
): Promise<NutritionAnalysisResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("meal_type", mealType);
  
  const response = await fetch(`${API_BASE}/nutrition/analyze-and-log`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  
  return response.json();
};
```

**Why it's Adapter Pattern**:
- **Incompatible Interface**: Raw `fetch()` API is low-level, untyped
- **Target Interface**: Type-safe, domain-specific functions
- **Adapter**: `api-client.ts` translates between the two
- **Benefit**: Components don't deal with URLs, headers, error handling

---

## 🔷 React-Specific Patterns (Advanced)

### 3. **Container/Presentational Pattern** (Smart vs Dumb Components)

**Location**: `dish-analyzer.tsx`, `recipe-generator.tsx`

**Implementation**:
```typescript
// DishAnalyzer is a "Container" (Smart Component)
export function DishAnalyzer() {
  // Business logic: state management
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Data fetching
  const handleAnalyzeAndLog = async (mealType: string) => {
    const data = await analyzeAndLogDish(file, mealType, token);
    setResult(data);
  };
  
  // Presentation: delegates to dumb components
  return (
    <Card>
      <Button onClick={handleAnalyzeAndLog}>Analyze</Button>
      {result && <NutritionDisplay data={result} />}
    </Card>
  );
}
```

**Pattern Breakdown**:
- **Container (Smart)**: Manages state, handles API calls, business logic
- **Presentational (Dumb)**: UI components (`Button`, `Card`) - receive props, display only
- **Separation**: Logic separated from presentation

**Alternative Modern Approach**: The components could be further split:
```typescript
// Pure presentation (could be in components/ui/)
function DishAnalyzerUI({ onAnalyze, result, loading }) {
  return <Card>...</Card>;
}

// Container with logic (current implementation)
function DishAnalyzer() {
  const logic = useDishAnalyzer();
  return <DishAnalyzerUI {...logic} />;
}
```

---

### 4. **Compound Component Pattern** (Implicit)

**Location**: `recipe-generator.tsx` with `Card` composition

**Implementation**:
```typescript
<Card>
  <CardHeader>
    <CardTitle>Generate Recipe</CardTitle>
    <CardDescription>Upload ingredients photo OR type them</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Form inputs */}
  </CardContent>
</Card>
```

**Why it's Compound Pattern**:
- **Parent Component**: `Card` manages shared context
- **Child Components**: `CardHeader`, `CardTitle`, `CardContent` work together
- **Implicit State Sharing**: Children inherit styling/context from parent
- **Flexibility**: Can rearrange children, add/remove parts

**Real Example from codebase**:
```typescript
// Compound component with Sheet (Mobile Sidebar)
<Sheet>
  <SheetTrigger>
    <Button>Menu</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetTitle>Navigation</SheetTitle>
    <nav>...</nav>
  </SheetContent>
</Sheet>
```

---

### 5. **Render Props Pattern** (Via Hooks - Modern Alternative)

**Location**: `use-goal-notifications.ts`

**Classic Render Props** (Old way):
```typescript
<NotificationProvider>
  {({ notifications, checkNotifications }) => (
    <div>
      {notifications.map(n => <Toast {...n} />)}
    </div>
  )}
</NotificationProvider>
```

**Modern Hook Alternative** (Current implementation):
```typescript
export function useGoalNotifications(enabled: boolean = true) {
  const checkNotifications = useCallback(async () => {
    // Poll for notifications
    const notifications = await getNotifications(token, true);
    
    // Display as toasts
    notifications.forEach(n => toast.success(n.title));
  }, [enabled]);
  
  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [checkNotifications, enabled]);
  
  return { checkNotifications };
}

// Usage in component
function Dashboard() {
  const { checkNotifications } = useGoalNotifications(true);
  // Component receives functionality without prop drilling
}
```

**Why it's Render Props Pattern (modernized)**:
- **Encapsulation**: Logic encapsulated in hook
- **Reusability**: Any component can use the hook
- **Inversion of Control**: Component controls what to do with functionality
- **No JSX Props**: Cleaner than render props, same concept

---

### 6. **Higher-Order Component (HOC) Pattern** (Protection/Guard Pattern)

**Location**: Implicit in route protection (not shown in provided files, but common pattern)

**Typical Implementation**:
```typescript
// HOC for authentication guard
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user) {
      redirect('/auth/login');
      return null;
    }
    
    return <Component {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

**Current Implementation** (via `useAuth()` check):
```typescript
function Dashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" />;
  
  return <div>Dashboard content</div>;
}
```

---

## 🌐 Web-Specific Patterns

### 7. **State Machine Pattern** (Implicit)

**Location**: `dish-analyzer.tsx`, `recipe-generator.tsx`

**Implementation**:
```typescript
// State machine for file upload flow
export function DishAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageChanged, setImageChanged] = useState(false);
  
  // State transitions:
  // 1. IDLE -> (upload) -> PREVIEW
  // 2. PREVIEW -> (analyze) -> LOADING
  // 3. LOADING -> (success) -> RESULT
  // 4. LOADING -> (error) -> ERROR
  // 5. RESULT -> (new upload) -> PREVIEW (reset)
}
```

**State Machine Visualization**:
```
┌──────┐  upload   ┌─────────┐  analyze  ┌─────────┐
│ IDLE │ ───────> │ PREVIEW │ ────────> │ LOADING │
└──────┘           └─────────┘           └─────────┘
                        │                      │
                        │                      ├─success─> RESULT
                        │                      └─error───> ERROR
                        │                           │
                        └───────<─────────────────-─┘
                              (new upload/reset)
```

**Why it's State Machine**:
- **Finite States**: Component can be in specific states
- **Transitions**: Clear transitions between states
- **Guards**: `if (!file) return;` - prevents invalid transitions
- **Side Effects**: API calls happen during transitions

**More Formal Implementation** (could be improved with XState):
```typescript
type State = 
  | { status: 'idle' }
  | { status: 'preview', file: File, preview: string }
  | { status: 'loading' }
  | { status: 'result', data: any }
  | { status: 'error', error: string };

const [state, setState] = useState<State>({ status: 'idle' });
```

---

### 8. **Polling Pattern** (Observer Variant)

**Location**: `use-goal-notifications.ts`

**Implementation**:
```typescript
export function useGoalNotifications(enabled: boolean = true) {
  const checkNotifications = useCallback(async () => {
    const notifications = await getNotifications(token, true);
    notifications.forEach(n => displayToast(n));
  }, [enabled]);

  useEffect(() => {
    checkNotifications(); // Initial check
    
    // Poll every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    
    return () => clearInterval(interval); // Cleanup
  }, [checkNotifications, enabled]);
}
```

**Why it's a Pattern**:
- **Problem**: Real-time notifications without WebSockets
- **Solution**: Periodic polling with automatic cleanup
- **Benefits**: Simple, works with RESTful APIs
- **Trade-offs**: Less real-time than WebSockets, more API calls

**Alternative Approaches**:
```typescript
// WebSocket Pattern (more real-time)
const ws = new WebSocket('ws://api/notifications');
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  displayToast(notification);
};

// Server-Sent Events (SSE) Pattern
const eventSource = new EventSource('/api/notifications/stream');
eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  displayToast(notification);
};
```

---

### 9. **Facade Pattern** (Form Handling)

**Location**: `login-form.tsx`, `sign-up-form.tsx`

**Implementation**:
```typescript
export function LoginForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      // Facade: simplifies complex authentication process
      const { access_token } = await login(email, password);
      localStorage.setItem("access_token", access_token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
}
```

**Why it's Facade**:
- **Complex Subsystem**: Form validation, API call, token storage, error handling, navigation
- **Simple Interface**: `handleSubmit` - single function call
- **Hides Complexity**: Component doesn't know about token storage details, API structure
- **Abstraction**: Could swap authentication method without changing form UI

---

### 10. **Strategy Pattern** (Conditional Rendering)

**Location**: `recipe-generator.tsx`, `public-recipes.tsx`

**Implementation**:
```typescript
export function RecipeGenerator() {
  // Strategy 1: Show upload area
  {!preview && !ingredientsText && (
    <UploadArea onClick={() => fileInputRef.current?.click()} />
  )}
  
  // Strategy 2: Show form with image/text input
  {(preview || ingredientsText) && (
    <div className="grid lg:grid-cols-2 gap-6">
      <FormCard />
      
      {/* Sub-strategy: loading vs result vs empty */}
      {loading ? (
        <LoadingCard />
      ) : recipe ? (
        <RecipeDisplay recipe={recipe} />
      ) : null}
    </div>
  )}
}
```

**Why it's Strategy Pattern**:
- **Context**: Component decides which UI strategy to use
- **Strategies**: Different rendering approaches based on state
- **Selection**: Conditionally selects strategy at runtime
- **Flexibility**: Easy to add new strategies (e.g., error state)

**More Explicit Strategy Pattern**:
```typescript
const renderStrategies = {
  idle: () => <UploadArea />,
  preview: () => <FormWithPreview />,
  loading: () => <LoadingSpinner />,
  result: (data) => <ResultDisplay data={data} />,
  error: (error) => <ErrorMessage error={error} />
};

return renderStrategies[currentState]();
```

---

## 🎨 Advanced React Patterns

### 11. **Ref Forwarding Pattern** (Hidden File Input)

**Location**: `dish-analyzer.tsx`, `recipe-generator.tsx`

**Implementation**:
```typescript
export function DishAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div>
      {/* Hidden input - controlled programmatically */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Trigger from any UI element */}
      <Card onClick={() => fileInputRef.current?.click()}>
        <Upload /> Click to upload
      </Card>
    </div>
  );
}
```

**Why it's a Pattern**:
- **Problem**: Default file input is ugly, can't be styled
- **Solution**: Hide real input, trigger via ref from styled elements
- **Benefit**: Full control over upload UI while using native functionality
- **Pattern Name**: "Proxy Pattern" or "Ref Forwarding Pattern"

---

### 12. **Controlled Component Pattern** (React Forms)

**Location**: All form components (`login-form.tsx`, `recipe-generator.tsx`)

**Implementation**:
```typescript
export function RecipeGenerator() {
  const [ingredientsText, setIngredientsText] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  
  return (
    <form>
      <Textarea
        value={ingredientsText}
        onChange={(e) => setIngredientsText(e.target.value)}
      />
      <Input
        value={cuisine}
        onChange={(e) => setCuisine(e.target.value)}
      />
      {DIETARY_RESTRICTIONS.map((diet) => (
        <Checkbox
          checked={dietary.includes(diet.value)}
          onCheckedChange={() => toggleDietary(diet.value)}
        />
      ))}
    </form>
  );
}
```

**Why it's Controlled Component Pattern**:
- **Single Source of Truth**: React state controls input values
- **Two-way Binding**: Changes flow: Input → State → Re-render → Input
- **Validation**: Can validate on every keystroke
- **Benefits**: Predictable, easier to test, can manipulate programmatically

**Uncontrolled Alternative** (not used in codebase):
```typescript
// Uncontrolled - less React-like
const inputRef = useRef<HTMLInputElement>(null);
const handleSubmit = () => {
  const value = inputRef.current?.value; // Read value only when needed
};
return <input ref={inputRef} defaultValue="initial" />;
```

---

### 13. **Memoization Pattern** (Performance Optimization)

**Location**: `use-goal-notifications.ts`

**Implementation**:
```typescript
export function useGoalNotifications(enabled: boolean = true) {
  // Memoize callback to prevent unnecessary re-renders
  const checkNotifications = useCallback(async () => {
    if (!enabled) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    const response = await getNotifications(token, true);
    // ... process notifications
  }, [enabled]); // Only recreate if 'enabled' changes
  
  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [checkNotifications, enabled]); // Stable dependency
}
```

**Why it's Memoization Pattern**:
- **Problem**: Function recreated on every render → breaks `useEffect` dependency
- **Solution**: `useCallback` memoizes function reference
- **Benefit**: Prevents infinite loops, improves performance
- **Related**: `useMemo` for expensive computations

**When to Use**:
```typescript
// Expensive calculation
const sortedRecipes = useMemo(() => {
  return recipes.sort((a, b) => a.calories - b.calories);
}, [recipes]);

// Expensive component
const MemoizedRecipeCard = React.memo(RecipeCard);
```

---

### 14. **Error Boundary Pattern** (Implicit)

**Not explicitly shown, but should exist in production**

**Implementation**:
```typescript
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{this.state.error?.message}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <DishAnalyzer />
</ErrorBoundary>
```

**Why it's Important**:
- **Prevents**: Entire app crashing from component errors
- **Graceful**: Shows error UI instead of white screen
- **Recovery**: Can provide "Try Again" button

---

### 15. **Optimistic UI Pattern** (Implicit in recipe-generator.tsx)

**Location**: `recipe-generator.tsx`

**Current Implementation**:
```typescript
const handleGenerate = async () => {
  setLoading(true);
  
  try {
    const result = await generateRecipe(input);
    setRecipe(result);
    
    // Auto-save as private
    if (token) {
      const savedRecipe = await createRecipe({ ...result, is_public: false }, token);
      setSavedRecipeId(savedRecipe.id);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Optimistic UI Enhancement**:
```typescript
const handleGenerate = async () => {
  // Optimistically show success UI immediately
  const optimisticRecipe = {
    title: "Generating your recipe...",
    status: "pending"
  };
  setRecipe(optimisticRecipe);
  
  try {
    const result = await generateRecipe(input);
    setRecipe(result); // Replace with real data
  } catch (err) {
    setRecipe(null); // Rollback on error
    setError(err.message);
  }
};
```

**Why Optimistic UI**:
- **Perceived Performance**: UI feels instant
- **Better UX**: No waiting for loading spinners
- **Rollback**: Revert if operation fails

---

## 📊 Pattern Summary Table

| Pattern | Location | Type | Use Case |
|---------|----------|------|----------|
| Observer (Context API) | `auth-context.tsx` | Behavioral | Global auth state |
| Adapter | `api-client.ts` | Structural | API abstraction |
| Container/Presentational | All components | Structural | Separate logic/UI |
| Compound Component | `Card`, `Sheet` usage | Structural | Flexible composition |
| Hooks (Render Props) | `use-goal-notifications.ts` | Behavioral | Reusable logic |
| State Machine | `dish-analyzer.tsx` | Behavioral | UI flow control |
| Polling | `use-goal-notifications.ts` | Behavioral | Real-time-ish updates |
| Facade | Form handlers | Structural | Simplify complex ops |
| Strategy (Conditional) | `recipe-generator.tsx` | Behavioral | Dynamic rendering |
| Ref Forwarding | File inputs | Structural | Imperative DOM |
| Controlled Component | All forms | Structural | Form state mgmt |
| Memoization | `useCallback` usage | Performance | Prevent re-renders |
| Error Boundary | (Should exist) | Structural | Error handling |
| Optimistic UI | (Partial) | UX | Perceived perf |
| HOC (Guard) | (Could exist) | Structural | Route protection |

---

## 🎯 Key Takeaways

### Patterns Actually Used in Your Frontend:
1. ✅ **Observer** - Context API for auth state
2. ✅ **Adapter** - API client wrapping fetch
3. ✅ **Facade** - Simplified form submission
4. ✅ **Strategy** - Conditional rendering
5. ✅ **State Machine** - UI state management
6. ✅ **Polling** - Notification checking
7. ✅ **Memoization** - Performance with useCallback
8. ✅ **Controlled Components** - All forms
9. ✅ **Ref Forwarding** - Hidden file inputs
10. ✅ **Container/Presentational** - Smart/dumb separation

### React-Specific "Patterns":
- **Hooks** - Modern alternative to HOCs/Render Props
- **Compound Components** - shadcn/ui component composition
- **Composition over Inheritance** - React's philosophy

### Missing Patterns (Could Add):
- ❌ Error Boundaries - Should add for production
- ❌ Suspense - For async data loading (React 18+)
- ❌ Optimistic UI - Improve perceived performance
- ❌ Virtualization - For long recipe lists

---

## 🚀 Conclusion

Your frontend uses **10+ design patterns**, many adapted specifically for React's component model:

1. **Classic Patterns**: Observer, Adapter, Facade, Strategy
2. **React Patterns**: Hooks, Controlled Components, Compound Components
3. **Web Patterns**: Polling, State Machines, Ref Forwarding
4. **Performance Patterns**: Memoization

These patterns make your code:
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Reusable** - Hooks and components can be shared
- ✅ **Testable** - Logic separated from presentation
- ✅ **Scalable** - Easy to add features without breaking existing code

The patterns are **practical and not over-engineered**, which follows React's philosophy of pragmatic solutions over theoretical purity.
