import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn && this.authService.isAdmin) {
      
      return true;
    }

    console.warn('Admin access denied, redirecting to admin login');
    this.router.navigate(['/admin-login']);
    return false;
  }
}
