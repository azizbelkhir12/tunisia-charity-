import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {
  email = '';
  userType = '';

  sent = false;
  isLoading = false;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.configurePageMetadata();
  }

  onSubmit(): void {
    const formattedEmail = this.email.trim().toLowerCase();

    if (!formattedEmail || !this.userType) {
      Swal.fire({
        icon: 'warning',
        title: 'Informations manquantes',
        text: 'Veuillez saisir votre email et sélectionner votre type de compte.',
        confirmButtonText: 'D’accord',
        confirmButtonColor: '#235787'
      });

      return;
    }

    this.isLoading = true;
    this.sent = false;

    this.authService
      .forgotPassword(formattedEmail, this.userType)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.sent = true;

          Swal.fire({
            icon: 'success',
            title: 'Email envoyé',
            text:
              response?.message ||
              'Un lien de réinitialisation vous a été envoyé.',
            confirmButtonText: 'D’accord',
            confirmButtonColor: '#235787'
          });
        },

        error: (error: HttpErrorResponse) => {
          Swal.fire({
            icon: 'error',
            title: 'Envoi impossible',
            text:
              error.error?.message ||
              "Une erreur est survenue lors de l'envoi de l'email.",
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#235787'
          });
        }
      });
  }

  private configurePageMetadata(): void {
    this.titleService.setTitle(
      'Mot de passe oublié — Tunisia Charity'
    );

    this.metaService.updateTag({
      name: 'description',
      content:
        'Réinitialisez votre mot de passe Tunisia Charity en quelques étapes.'
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: 'Mot de passe oublié — Tunisia Charity'
    });

    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Recevez un lien pour réinitialiser votre mot de passe.'
    });
  }
}
