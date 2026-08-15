import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthTokenService } from './auth-token.service';

/** Blocks feature routes unless a token is present; sends guests to login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const tokens = inject(AuthTokenService);
  const router = inject(Router);
  if (tokens.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: { redirect: state.url },
  });
};

/** Keeps authenticated users out of the login/register pages. */
export const guestGuard: CanActivateFn = () => {
  const tokens = inject(AuthTokenService);
  const router = inject(Router);
  return tokens.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
