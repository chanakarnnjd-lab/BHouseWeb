import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_EMAIL_STORAGE_KEY,
  AUTH_USER_ID_STORAGE_KEY,
  AUTH_USER_NAME_STORAGE_KEY
} from './auth-token';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  const isApiRequest = request.url === apiUrl || request.url.startsWith(`${apiUrl}/`);
  const isLoginRequest = request.url === `${apiUrl}/auth/login`;
  const canAccessSession = typeof sessionStorage !== 'undefined';
  const token = canAccessSession ? sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
  const router = inject(Router);
  const authenticatedRequest = isApiRequest && !isLoginRequest && token !== null;
  const authorizedRequest = authenticatedRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (authenticatedRequest && error instanceof HttpErrorResponse && error.status === 401) {
        sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_USER_EMAIL_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_USER_ID_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_USER_NAME_STORAGE_KEY);
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
