# Authentication Improvements & Security Recommendations

## ✅ What We Just Fixed

### 1. **Eliminated UI Flicker on Page Load**
   - **Problem**: User appeared logged out briefly, then logged in after verification
   - **Solution**: Created `AuthContext` that:
     - Checks authentication ONCE on app startup
     - Stores user state globally
     - Shows loading spinner until auth is verified
     - Prevents multiple API calls to `/auth/me`
   
   **Result**: Smooth, flicker-free experience! 🎉

### 2. **Reduced Unnecessary Auth Requests**
   - **Before**: Every component checked `localStorage` and called `/auth/me`
   - **After**: Single auth check in `AuthContext`, shared across all components
   - **Benefit**: Fewer API calls = faster app + less server load

### 3. **Centralized Auth Logic**
   - All auth operations (login, logout, user state) in one place
   - Components use `useAuth()` hook instead of duplicating logic
   - Easier to maintain and debug

## 🔒 Security Recommendations for Production

### Current Setup (Development)
```
✓ JWT stored in localStorage
✓ 1-hour expiration
✗ No refresh token
✗ Manual re-login after 1 hour
```

### Recommended Setup (Production)

#### Option 1: **Refresh Token Pattern** (Recommended)
Backend needs to implement:
1. **Access Token**: Short-lived (15 minutes), stored in memory or localStorage
2. **Refresh Token**: Long-lived (7-30 days), stored in httpOnly cookie
3. **Auto-refresh**: When access token expires, use refresh token to get new one

**Backend Changes Needed:**
```python
# backend/app/api/auth.py

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str = Cookie(None),
    db: DatabaseManager = Depends(get_database)
):
    """Exchange refresh token for new access token"""
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    
    # Verify refresh token
    payload = jwt.decode(refresh_token, SECRET_KEY)
    user_id = payload.get("sub")
    
    # Issue new access token
    access_token = create_access_token(user_id, expires_minutes=15)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login")
async def login(...):
    # ... existing login logic ...
    
    # Create tokens
    access_token = create_access_token(user.id, expires_minutes=15)
    refresh_token = create_refresh_token(user.id, expires_days=30)
    
    response = JSONResponse({
        "access_token": access_token,
        "token_type": "bearer"
    })
    
    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,  # Can't be accessed by JavaScript
        secure=True,    # HTTPS only
        samesite="lax", # CSRF protection
        max_age=30*24*60*60  # 30 days
    )
    
    return response
```

**Frontend Changes:**
```typescript
// contexts/auth-context.tsx

// Intercept 401 errors and auto-refresh
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("access_token");
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If 401, try refreshing token
  if (response.status === 401) {
    const refreshResponse = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Send cookies
    });

    if (refreshResponse.ok) {
      const { access_token } = await refreshResponse.json();
      localStorage.setItem("access_token", access_token);
      
      // Retry original request
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${access_token}`,
        },
      });
    } else {
      // Refresh failed, logout
      logout();
      throw new Error("Session expired");
    }
  }

  return response;
};
```

#### Option 2: **Session-Based Auth** (Alternative)
- Store session ID in httpOnly cookie
- Keep user data on server (Redis/database)
- No JWT, just session validation

**Pros:**
- More secure (can't be stolen from localStorage)
- Easy to revoke sessions
- No token refresh complexity

**Cons:**
- Requires session storage (Redis recommended)
- More server-side state

### Why httpOnly Cookies Are More Secure

| Storage Method | XSS Vulnerable | CSRF Vulnerable | Notes |
|----------------|----------------|-----------------|-------|
| `localStorage` | ✗ Yes | ✓ No | JavaScript can steal token |
| `httpOnly Cookie` | ✓ No | ✗ Yes (mitigated with SameSite) | Browser-only access |

**httpOnly Cookie Protection:**
```typescript
// Backend sets cookie
response.set_cookie(
    key="refresh_token",
    value=token,
    httponly=True,   // ← JavaScript can't read it
    secure=True,     // ← HTTPS only
    samesite="lax"   // ← CSRF protection
)
```

## 📊 Current Auth Flow vs Recommended

### Current (Development)
```
1. Login → Get JWT token
2. Store in localStorage
3. Use for 1 hour
4. Expires → User must re-login ❌
```

### Recommended (Production)
```
1. Login → Get access token + refresh token (httpOnly cookie)
2. Use access token (15 min lifespan)
3. Access token expires → Auto-refresh using refresh token
4. User stays logged in for 30 days 💚
5. Refresh token expires → User must re-login
```

## 🔧 Implementation Priority

### Phase 1 (✅ DONE)
- [x] Create AuthContext to eliminate flicker
- [x] Reduce duplicate auth requests
- [x] Centralize auth logic

### Phase 2 (Recommended for Production)
- [ ] Backend: Add refresh token endpoint
- [ ] Backend: Set refresh tokens in httpOnly cookies
- [ ] Frontend: Implement auto-refresh logic
- [ ] Frontend: Add axios/fetch interceptor

### Phase 3 (Optional Enhancements)
- [ ] Add "Remember me" checkbox (7 vs 30 day expiry)
- [ ] Implement sliding sessions (extend on activity)
- [ ] Add device tracking (logout other devices)
- [ ] Add 2FA support

## 🎯 Answer to Your Questions

### Q1: "Can we reduce auth requests?"
**A**: ✅ Yes! We just did with `AuthContext`. Now only 1 request on app load instead of multiple per page.

### Q2: "Is it OK to keep for security?"
**A**: 
- **Development**: Current setup is fine
- **Production**: Should implement refresh tokens + httpOnly cookies
- **Why**: XSS attacks can steal localStorage tokens

### Q3: "Keep me logged in instead of 1-hour logout?"
**A**: ✅ Implement refresh tokens (see Option 1 above)
- Access token: 15 minutes
- Refresh token: 30 days
- Auto-refresh when active
- User stays logged in as long as they use the app

## 📚 Resources

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0: Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/tutorial/security/)
