import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const offlineGuard = () => {
  const router = inject(Router);

  if ((window as any).__TAURI_OFFLINE__) {
    return router.createUrlTree(['/offline']);
  }

  return true;
};
