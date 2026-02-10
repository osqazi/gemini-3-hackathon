"""
Frontend Integration Guide for RecipeRAG API

This document explains how to properly make requests to the RecipeRAG backend API
from your frontend application to ensure session management works correctly.

## Key Points for Frontend Developers:

### 1. Include Credentials in Fetch Requests
When making requests to the backend, you must include credentials to ensure
session information is preserved:

```javascript
// Example fetch request with credentials
const response = await fetch('https://osqazi-g3h.hf.space/api/v1/analyze-photo', {
  method: 'POST',
  credentials: 'include',  // Important: Include credentials
  headers: {
    'Accept': 'application/json',
  },
  body: formData  // FormData containing the image and session_id
});
```

### 2. Session ID Management
The backend uses session IDs to maintain conversation state. You should:

1. Store the session_id returned by the backend (especially from /analyze-photo)
2. Pass the same session_id in subsequent requests to maintain continuity
3. Persist the session_id in localStorage or sessionStorage if needed

```javascript
// Example of handling session ID
const analyzePhoto = async (imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  // Include session_id if you have one from a previous request
  if (currentSessionId) {
    formData.append('session_id', currentSessionId);
  }
  
  const response = await fetch('https://osqazi-g3h.hf.space/api/v1/analyze-photo', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  const data = await response.json();
  
  // Save the session_id for future requests
  if (data.session_id) {
    setCurrentSessionId(data.session_id); // Store in your state management
  }
  
  return data;
};
```

### 3. Chat Endpoint Usage
When using the chat endpoint, always include the session_id:

```javascript
const sendMessage = async (sessionId, message) => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('message', message);
  formData.append('include_preferences', 'true');
  
  const response = await fetch('https://osqazi-g3h.hf.space/api/v1/chat', {
    method: 'POST',
    credentials: 'include',  // Important: Include credentials
    body: formData
  });
  
  return await response.json();
};
```

### 4. Error Handling
Handle potential CORS and session-related errors:

```javascript
const makeApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      credentials: 'include',  // Always include credentials
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    // Handle error appropriately
  }
};
```

### 5. Headers for Authentication (if needed)
Some endpoints may require additional headers:

```javascript
// For endpoints that require user authentication
const response = await fetch('https://osqazi-g3h.hf.space/api/v1/profile', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'X-User-ID': userId,  // If you have user authentication
  }
});
```

## Important Notes:

- The backend uses in-memory session storage, so sessions may be lost on server restarts
- Always pass the session_id between related requests to maintain conversation context
- Use credentials: 'include' in all fetch requests to ensure proper session handling
- The backend supports CORS from https://gemini-3-ht.vercel.app (your Vercel deployment)

Following these guidelines will ensure that your frontend properly communicates with the backend and maintains session state across requests.
"""