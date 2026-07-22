import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  standalone:false,
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
  loginData = {
    email: '',
    password: '',
    userType: 'admin'
  };

  loginErrorMsg = '';
  loginSuccessMsg = 'Connexion réussie';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  submitLogin(): void {
    if (
      !this.loginData.email.trim() ||
      !this.loginData.password
    ) {
      this.loginErrorMsg = 'Veuillez remplir les champs.';
      return;
    }

    this.isLoading = true;
    this.loginErrorMsg = '';

    this.authService.login(this.loginData).subscribe({
      next: response => {

        if (
          !response?.token ||
          !response?.data?.user
        ) {
          this.loginErrorMsg =
            'Réponse invalide du serveur.';

          this.isLoading = false;
          return;
        }

        const authenticatedUser = {
          ...response.data.user,

          id:
            response.data.user.id ||
            response.data.user._id,

          userType:
            response.data.userType ||
            this.loginData.userType
        };

        localStorage.setItem(
          'token',
          response.token
        );

        localStorage.setItem(
          'currentUser',
          JSON.stringify(authenticatedUser)
        );

        this.authService.currentUser.next(
          authenticatedUser
        );

        this.isLoading = false;

        this.router.navigate(['/admin-compte']);
      },

      error: error => {
        console.error('Login error:', error);

        this.loginErrorMsg =
          error.error?.message ||
          'Échec de connexion';

        this.isLoading = false;
      }
    });
  }
}

