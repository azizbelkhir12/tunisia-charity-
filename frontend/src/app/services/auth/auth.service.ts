import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
   // Only one BehaviorSubject
  currentUser: BehaviorSubject<any>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');

    let user = null;

    try {
      user = storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('currentUser');
    }

    this.currentUser = new BehaviorSubject<any>(user);
  }

  get currentUserValue(): any {
    return this.currentUser.value;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get isLoggedIn(): boolean {
    return Boolean(
      this.currentUserValue &&
      this.token &&
      !this.isTokenExpired()
    );
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
  }

  register(donorData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/donors/register`,
      donorData
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/login`,
      credentials
    );
  }

  forgotPassword(
    email: string,
    userType: string
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/forgot-password`,
      {
        email,
        userType
      }
    );
  }

  resetPassword(
    token: string,
    newPassword: string
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/reset-password`,
      {
        token,
        newPassword
      }
    );
  }

  getCurrentUserId(): string | null {
    const user = this.currentUserValue;

    return user?.id || user?._id || null;
  }

  getProfile(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/auth/me`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  isTokenExpired(): boolean {
    const token = this.token;

    if (!token) {
      return true;
    }

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      return !decoded.exp || decoded.exp <= currentTime;
    } catch (error) {
      return true;
    }
  }

  hasRole(role: string): boolean {
    return (
      this.currentUserValue?.userType?.toLowerCase() ===
      role.toLowerCase()
    );
  }

  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  autoLogin(): void {
    const token = this.token;

    if (!token || this.isTokenExpired()) {
      return;
    }

    this.getProfile().subscribe({
      next: response => {
        const user = response?.data?.user || response?.user || response;

        const userInfo = {
          ...user,
          id: user.id || user._id,
          userType:
            response?.data?.userType ||
            response?.userType ||
            user.userType
        };

        localStorage.setItem(
          'currentUser',
          JSON.stringify(userInfo)
        );

        this.currentUser.next(userInfo);
      },

      error: () => {
        this.logout();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');

    this.currentUser.next(null);

    this.router.navigate(['/login']);
  }
}
