import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { AuthService } from '../services/auth/auth.service';



@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit{
  password = '';
  confirmPassword = '';
  token = '';

  showPassword = false;
  done = false;
  isLoading = false;

  error: string | null = null;

  readonly strengthSegments = [0, 1, 2, 3];

  readonly strengthLabels = [
    'Très faible',
    'Faible',
    'Moyen',
    'Bon',
    'Excellent'
  ];

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.configurePageMetadata();
    this.getResetToken();
  }

  get passwordStrength(): number {
    return this.calculatePasswordStrength(this.password);
  }

  get passwordStrengthLabel(): string {
    return this.strengthLabels[this.passwordStrength];
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isStrengthSegmentActive(segmentIndex: number): boolean {
    return segmentIndex < this.passwordStrength;
  }

  getStrengthSegmentClass(): string {
    switch (this.passwordStrength) {
      case 1:
        return 'strength-very-weak';

      case 2:
        return 'strength-medium';

      case 3:
        return 'strength-good';

      case 4:
        return 'strength-excellent';

      default:
        return 'strength-inactive';
    }
  }

  onSubmit(): void {
    this.error = null;

    if (!this.token) {
      Swal.fire({
        icon: 'error',
        title: 'Lien invalide',
        text: 'Le token de réinitialisation est manquant ou invalide.',
        confirmButtonText: 'D’accord',
        confirmButtonColor: '#235787'
      });

      return;
    }

    if (!this.password || !this.confirmPassword) {
      this.error = 'Veuillez remplir les deux champs.';

      Swal.fire({
        icon: 'warning',
        title: 'Champs obligatoires',
        text: 'Veuillez saisir et confirmer votre nouveau mot de passe.',
        confirmButtonText: 'D’accord',
        confirmButtonColor: '#235787'
      });

      return;
    }

    if (this.password.length < 8) {
      this.error =
        'Le mot de passe doit contenir au moins 8 caractères.';

      Swal.fire({
        icon: 'warning',
        title: 'Mot de passe trop court',
        text: this.error,
        confirmButtonText: 'D’accord',
        confirmButtonColor: '#235787'
      });

      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';

      Swal.fire({
        icon: 'warning',
        title: 'Confirmation incorrecte',
        text: this.error,
        confirmButtonText: 'D’accord',
        confirmButtonColor: '#235787'
      });

      return;
    }

    this.isLoading = true;

    this.authService
      .resetPassword(this.token, this.password)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.done = true;
          this.error = null;

          Swal.fire({
            icon: 'success',
            title: 'Mot de passe mis à jour',
            text:
              response?.message ||
              'Votre mot de passe a été réinitialisé avec succès.',
            confirmButtonText: 'D’accord',
            confirmButtonColor: '#235787'
          });
        },

        error: (error: HttpErrorResponse) => {
          this.done = false;

          const message = this.getErrorMessage(error);
          this.error = message;

          Swal.fire({
            icon: 'error',
            title: this.getErrorTitle(error),
            text: message,
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#235787'
          });
        }
      });
  }

  private getResetToken(): void {
    this.token =
      this.route.snapshot.queryParamMap.get('token')?.trim() || '';

    if (!this.token) {
      Swal.fire({
        icon: 'error',
        title: 'Lien de réinitialisation invalide',
        text: 'Ce lien ne contient aucun token de réinitialisation.',
        confirmButtonText: 'D’accord',
        confirmButtonColor: '#235787'
      });
    }
  }

  private getErrorTitle(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'Serveur inaccessible';

      case 400:
        return 'Demande invalide';

      case 401:
        return 'Lien invalide';

      case 403:
        return 'Accès refusé';

      case 404:
        return 'Utilisateur introuvable';

      case 410:
        return 'Lien expiré';

      case 500:
        return 'Erreur du serveur';

      default:
        return 'Réinitialisation impossible';
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez que le backend est démarré.';
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 401 || error.status === 410) {
      return 'Le lien de réinitialisation est invalide ou expiré.';
    }

    return 'Une erreur est survenue pendant la réinitialisation du mot de passe.';
  }

  private calculatePasswordStrength(password: string): number {
    let score = 0;

    if (password.length >= 8) {
      score++;
    }

    if (/[A-Z]/.test(password)) {
      score++;
    }

    if (/[0-9]/.test(password)) {
      score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    }

    return score;
  }

  private configurePageMetadata(): void {
    this.titleService.setTitle(
      'Réinitialiser le mot de passe — Tunisia Charity'
    );

    this.metaService.updateTag({
      name: 'description',
      content:
        'Choisissez un nouveau mot de passe pour votre compte Tunisia Charity.'
    });

    this.metaService.updateTag({
      property: 'og:title',
      content:
        'Réinitialiser le mot de passe — Tunisia Charity'
    });

    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Définissez un nouveau mot de passe sécurisé.'
    });
  }
}
