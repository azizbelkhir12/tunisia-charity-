import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
  // Only one BehaviorSubject
  currentUser: BehaviorSubject<any>;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    this.currentUser = new BehaviorSubject<any>(null);
  }

  get currentUserValue(): any {
    return this.currentUser.value;
  }

  get isLoggedIn(): boolean {
    return Boolean(this.currentUserValue);
  }

  register(donorData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/donors/register`, donorData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  forgotPassword(email: string, userType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, {
      email,
      userType,
    });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
    });
  }

  getCurrentUserId(): string | null {
    const user = this.currentUserValue;

    return user?.id || user?._id || null;
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`);
  }

  setCurrentUser(user: any): void {
    this.currentUser.next(user);
  }

  hasRole(role: string): boolean {
    return (
      this.currentUserValue?.userType?.toLowerCase() === role.toLowerCase()
    );
  }

  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  autoLogin(): Promise<void> {
    return firstValueFrom(
      this.getProfile().pipe(
        tap((response) => {
          const user = response?.data?.user || response?.user || response;
          this.setCurrentUser({
            ...user,
            id: user.id || user._id,
            userType:
              response?.data?.userType || response?.userType || user.userType,
          });
        }),
        catchError(() => {
          this.currentUser.next(null);
          return of(null);
        }),
      ),
    ).then(() => undefined);
  }

  logout(): void {
    this.http
      .post(`${this.apiUrl}/auth/logout`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.currentUser.next(null);

    this.router.navigate(['/login']);
  }
}
