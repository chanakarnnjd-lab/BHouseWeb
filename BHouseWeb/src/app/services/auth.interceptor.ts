import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN_STORAGE_KEY } from './auth-token';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url === '/api' || request.url.startsWith('/api/');
  const isLoginRequest = request.url === '/api/auth/login';
  if (!isApiRequest || isLoginRequest || typeof sessionStorage === 'undefined') {
    return next(request);
  }

  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) return next(request);

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
