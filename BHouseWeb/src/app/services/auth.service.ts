import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_EMAIL_STORAGE_KEY,
  AUTH_USER_NAME_STORAGE_KEY
} from './auth-token';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}

export interface AuthUser {
  name: string | null;
  email: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly api: ApiService) {}

  register(credentials: RegisterCredentials): Observable<void> {
    return this.api.post<unknown>('auth/register', credentials).pipe(
      map((response) => {
        if (!this.isRecord(response) || response['success'] !== true) {
          const message = this.isRecord(response) && typeof response['message'] === 'string'
            ? response['message']
            : 'Could not create your account.';
          throw new Error(message);
        }
        sessionStorage.setItem(AUTH_USER_NAME_STORAGE_KEY, credentials.name.trim());
        sessionStorage.setItem(AUTH_USER_EMAIL_STORAGE_KEY, credentials.email.trim());
      })
    );
  }

  login(credentials: LoginCredentials): Observable<string> {
    return this.api.post<unknown>('auth/login', credentials).pipe(
      map((response) => ({
        token: this.readToken(response),
        user: this.readUserFromResponse(response)
      })),
      tap(({ token, user }) => {
        const claims = this.readTokenClaims(token);
        const savedEmail = sessionStorage.getItem(AUTH_USER_EMAIL_STORAGE_KEY);
        const savedName = savedEmail?.toLowerCase() === credentials.email.trim().toLowerCase()
          ? sessionStorage.getItem(AUTH_USER_NAME_STORAGE_KEY)
          : null;
        sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
        sessionStorage.setItem(AUTH_USER_EMAIL_STORAGE_KEY, user.email ?? credentials.email.trim());
        const name = user.name ?? this.firstString(claims?.['name'], claims?.['fullName'], claims?.['username']) ?? savedName;
        if (name) sessionStorage.setItem(AUTH_USER_NAME_STORAGE_KEY, name);
        else sessionStorage.removeItem(AUTH_USER_NAME_STORAGE_KEY);
      }),
      map(({ token }) => token)
    );
  }

  logout(): Observable<void> {
    return this.api.post<unknown>('auth/logout', {}).pipe(
      map((response) => {
        if (this.isRecord(response) && response['success'] === false) {
          throw new Error(typeof response['message'] === 'string'
            ? response['message']
            : 'Could not sign out.');
        }
      }),
      tap(() => {
        sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_USER_EMAIL_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_USER_NAME_STORAGE_KEY);
      })
    );
  }

  isAuthenticated(): boolean {
    return typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) !== null;
  }

  getCurrentUser(): AuthUser | null {
    if (typeof sessionStorage === 'undefined') return null;

    const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;

    const claims = this.readTokenClaims(token);
    const tokenEmail = this.firstString(claims?.['email'], claims?.['preferred_username']);
    const email = tokenEmail ?? sessionStorage.getItem(AUTH_USER_EMAIL_STORAGE_KEY);
    const name = this.firstString(
      claims?.['name'],
      claims?.['fullName'],
      claims?.['username'],
      sessionStorage.getItem(AUTH_USER_NAME_STORAGE_KEY),
      email?.split('@')[0]
    );

    return { name, email };
  }

  private readToken(response: unknown): string {
    if (!this.isRecord(response)) {
      throw new Error('The login API returned an invalid response.');
    }

    if (response['success'] !== true) {
      throw new Error(typeof response['message'] === 'string' ? response['message'] : 'Sign in failed.');
    }

    const data = response['data'];
    const nestedToken = this.isRecord(data)
      ? data['token']
      : undefined;
    const token = response['token'] ?? response['accessToken'] ?? response['jwt'] ??
      (this.isRecord(data) ? data['accessToken'] ?? data['jwt'] : undefined) ?? nestedToken;
    if (typeof token !== 'string' || token.trim() === '') {
      throw new Error('The login API did not return an authentication token.');
    }
    return token;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private readUserFromResponse(response: unknown): AuthUser {
    if (!this.isRecord(response)) return { name: null, email: null };
    const data = this.isRecord(response['data']) ? response['data'] : null;
    const user = data && this.isRecord(data['user'])
      ? data['user']
      : this.isRecord(response['user']) ? response['user'] : data;
    if (!user) return { name: null, email: null };

    return {
      name: this.firstString(user['name'], user['fullName'], user['username'], user['userName']),
      email: this.firstString(user['email'])
    };
  }

  private readTokenClaims(token: string): Record<string, unknown> | null {
    const payload = token.split('.')[1];
    if (!payload) return null;

    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
      const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
      return this.isRecord(claims) ? claims : null;
    } catch {
      return null;
    }
  }

  private firstString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim() !== '') return value;
    }
    return null;
  }
}
