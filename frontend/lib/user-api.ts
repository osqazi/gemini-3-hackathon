// User API service for frontend
export interface UserApiResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    provider: string;
    is_active: boolean;
    is_verified: boolean;
  };
  message?: string;
}

export interface CreateUserRequest {
  email: string;
  provider: string;
  provider_id?: string;
  username?: string;
  password?: string;
}

export interface ValidateCredentialsRequest {
  email: string;
  password: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  username?: string;
}

// Get the backend API URL from environment
// Log the URL being used for debugging
console.log('Backend URL being used:', process.env.NEXT_PUBLIC_API_BASE_URL);
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Function to get cookies for requests (when available)
function getCookiesForRequest(): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side - get cookies from document
    return document.cookie;
  }
  // Server-side - cookies would need to be passed explicitly
  return undefined;
}

export const userApi = {
  // Lookup or create user
  async lookupOrCreate(userData: CreateUserRequest): Promise<UserApiResponse> {
    try {
      const url = `${BACKEND_URL}/api/v1/user/lookup-or-create`;
      console.log('Making request to:', url); // Debug log

      // Get any available cookies to include in the request
      const cookies = getCookiesForRequest();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (cookies) {
        headers['Cookie'] = cookies;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
        credentials: 'include', // Include credentials (cookies) for cross-origin requests
      });

      if (!response.ok) {
        console.error(`User API lookupOrCreate error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return {
          success: false,
          message: `HTTP error! status: ${response.status}`
        }; // Return a failure response instead of throwing
      }

      const data = await response.json();
      
      // Validate response data
      if (!data) {
        console.error('Null response received from user API lookupOrCreate');
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
      
      return data;
    } catch (error) {
      console.error('User API lookupOrCreate network error:', error);
      // Return a failure response instead of throwing to prevent authentication failure
      return {
        success: false,
        message: 'Network error connecting to user API'
      };
    }
  },

  // Validate credentials
  async validateCredentials(credentials: ValidateCredentialsRequest): Promise<UserApiResponse> {
    try {
      const url = `${BACKEND_URL}/api/v1/user/validate-credentials`;
      console.log('Making validateCredentials request to:', url); // Debug log

      // Get any available cookies to include in the request
      const cookies = getCookiesForRequest();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (cookies) {
        headers['Cookie'] = cookies;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(credentials),
        credentials: 'include', // Include credentials (cookies) for cross-origin requests
      });

      if (!response.ok) {
        console.error(`User API validateCredentials error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return {
          success: false,
          message: `HTTP error! status: ${response.status}`
        }; // Return a failure response instead of throwing
      }

      const data = await response.json();
      
      // Validate response data
      if (!data) {
        console.error('Null response received from user API validateCredentials');
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
      
      return data;
    } catch (error) {
      console.error('User API validateCredentials network error:', error);
      // Return a failure response instead of throwing to prevent authentication failure
      return {
        success: false,
        message: 'Network error connecting to user API'
      };
    }
  },

  // Register new user
  async register(userData: RegisterUserRequest): Promise<UserApiResponse> {
    try {
      const url = `${BACKEND_URL}/api/v1/user/register`;
      console.log('Making register request to:', url); // Debug log

      // Get any available cookies to include in the request
      const cookies = getCookiesForRequest();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (cookies) {
        headers['Cookie'] = cookies;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
        credentials: 'include', // Include credentials (cookies) for cross-origin requests
      });

      if (!response.ok) {
        console.error(`User API register error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return {
          success: false,
          message: `HTTP error! status: ${response.status}`
        }; // Return a failure response instead of throwing
      }

      const data = await response.json();
      
      // Validate response data
      if (!data) {
        console.error('Null response received from user API register');
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
      
      return data;
    } catch (error) {
      console.error('User API register network error:', error);
      // Return a failure response instead of throwing to prevent authentication failure
      return {
        success: false,
        message: 'Network error connecting to user API'
      };
    }
  }
};