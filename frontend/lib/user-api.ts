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
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const userApi = {
  // Lookup or create user
  async lookupOrCreate(userData: CreateUserRequest): Promise<UserApiResponse> {
    try {
      const url = `${BACKEND_URL}/api/v1/user/lookup-or-create`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.error(`User API lookupOrCreate error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('User API lookupOrCreate network error:', error);
      throw error;
    }
  },

  // Validate credentials
  async validateCredentials(credentials: ValidateCredentialsRequest): Promise<UserApiResponse> {
    try {
      const url = `${BACKEND_URL}/api/v1/user/validate-credentials`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        console.error(`User API validateCredentials error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('User API validateCredentials network error:', error);
      throw error;
    }
  },

  // Register new user
  async register(userData: RegisterUserRequest): Promise<UserApiResponse> {
    try {
      const url = `${BACKEND_URL}/api/v1/user/register`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        console.error(`User API register error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('User API register network error:', error);
      throw error;
    }
  }
};