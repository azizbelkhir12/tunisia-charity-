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
  private currentUserSubject: BehaviorSubject<any>;
  currentUser: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    try {
      this.currentUserSubject = new BehaviorSubject<any>(
        storedUser ? JSON.parse(storedUser) : null
      );
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem('currentUser');
      this.currentUserSubject = new BehaviorSubject<any>(null);
    }
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn() {
    return !!this.currentUserValue;
  }

  public get token() {
    return localStorage.getItem('token');
  }

  // Helper to get auth headers
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
  }

  // Register a new donor
  register(donorData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/donors/register`,
      donorData,
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`,credentials,);
  }


  forgotPassword(email: string, userType: string) {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email, userType });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser ? currentUser.id : null;
  }

  // Get authenticated user profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`, {
      headers: this.getAuthHeaders()
    });
  }

  // Check token expiration
  isTokenExpired(): boolean {
    const token = this.token;
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }


  // Logout method
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Check for specific user role (based on `userType`)
  hasRole(role: string): boolean {
    return this.currentUserValue?.userType === role;
  }

  // Check if user is admin
  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Automatically log in from token if available
  autoLogin(): void {
    const token = this.token;
    if (token && !this.isTokenExpired()) {
      this.getProfile().subscribe({
        next: (user) => {
          const userInfo = {
            id: user._id,
            userType: user.userType,
            email: user.email,
            nom: user.nom || ''
          };
          localStorage.setItem('currentUser', JSON.stringify(userInfo));
          this.currentUserSubject.next(userInfo);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }
}
