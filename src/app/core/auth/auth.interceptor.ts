import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthTokenService } from './auth-token.service';

/**
 * Attaches the bearer token to every request aimed at our own API.
 * Requests to other origins (e.g. Google Fonts) are left untouched.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthTokenService).token();
  if (token && req.url.startsWith(environment.apiBaseUrl)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
