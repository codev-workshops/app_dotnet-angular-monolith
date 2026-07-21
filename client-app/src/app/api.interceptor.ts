import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenService } from './auth-token.service';
import { environment } from '../environments/environment';

// Rewrites relative /api/* calls to the gateway origin and attaches the JWT.
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    const auth = inject(AuthTokenService);
    const headers = auth.token
      ? req.headers.set('Authorization', `Bearer ${auth.token}`)
      : req.headers;
    return next(req.clone({ url: `${environment.apiUrl}${req.url}`, headers }));
  }
  return next(req);
};
