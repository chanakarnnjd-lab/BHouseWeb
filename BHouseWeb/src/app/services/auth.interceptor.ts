import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN_STORAGE_KEY } from './auth-token';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  const isApiRequest = request.url === apiUrl || request.url.startsWith(`${apiUrl}/`);
  const isLoginRequest = request.url === `${apiUrl}/auth/login`;
  if (!isApiRequest || isLoginRequest || typeof sessionStorage === 'undefined') {
    return next(request);
  }

  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) return next(request);

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
