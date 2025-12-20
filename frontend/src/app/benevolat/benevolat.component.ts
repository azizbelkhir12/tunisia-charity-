import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PatternValidatorsService } from '../services/patternValidators/patern-validators.service';
import { ConfirmPasswordService } from '../services/confirm-password/confirm-password.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DemandeService } from '../services/demande/demande.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-benevolat',
  standalone: false,
  templateUrl: './benevolat.component.html',
  styleUrl: './benevolat.component.css'
})
export class BenevolatComponent {

  title: string = 'Up';
  titleS: string = 'Sign';
  errorMsg: string = "";
  path: string = "";
  user: any;
  isLoading: boolean = false;
  showOtpModal: boolean = false;
  otpCode: string = '';
  userEmail: string = '';



  constructor(private router: Router, private activatedRoute: ActivatedRoute, private demandeService: DemandeService) { }

  signupForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
    ]),
    Prenom: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50)
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ]),
    password: new FormControl('', [
      Validators.required,
      PatternValidatorsService.patternValidators(/\d/, { hasNumber: true }),
      PatternValidatorsService.patternValidators(/[A-Z]/, { hasCapitalCase: true }),
      PatternValidatorsService.patternValidators(/[a-z]/, { hasSmallCase: true }),
      PatternValidatorsService.patternValidators(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/, { hasSpecialCharacters: true }),
      Validators.minLength(8),
      Validators.maxLength(20)
    ]),
    confirmPassword: new FormControl('', [
      Validators.required
    ]),
    address: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100),
      Validators.pattern(/^(?!\s+$).*$/)
    ]),
    gouvernorat: new FormControl('', [
      Validators.required,
    ]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\+216\d{8}$/)
    ]),
    reason: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]),

    age: new FormControl('', [
      Validators.required,
      Validators.min(18),
      Validators.max(99)
    ])

  }, { validators: ConfirmPasswordService.matchingPassword() });

  gouvernorats: string[] = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan',
    'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'Manouba', 'Medenine', 'Monastir', 'Nabeul',
    'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  ngOnInit() {
    this.path = this.router.url;
  }

  submit() {
  this.signupForm.markAllAsTouched();

  if (this.signupForm.invalid) {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: 'Veuillez remplir tous les champs correctement',
    });
    return;
  }

  const formData = {
    ...this.signupForm.value,
    Prenom: this.signupForm.value.Prenom.trim(),
    age: Number(this.signupForm.value.age)
  };
  delete formData.confirmPassword;

  this.isLoading = true;

  this.demandeService.Demande(formData).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      this.userEmail = formData.email;
      this.showOtpModal = true; // 👈 Show modal

      Swal.fire({
        icon: 'info',
        title: 'Vérification requise',
        text: 'Un code OTP a été envoyé à votre e-mail.',
      });
    },
    error: (error) => {
      this.isLoading = false;
      const errorMessage = error.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
      });
    }
  });
}


verifyOtp() {
  if (!this.otpCode.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Attention',
      text: 'Veuillez entrer le code OTP envoyé à votre e-mail.',
    });
    return;
  }

  this.demandeService.verifyOtp(this.userEmail, this.otpCode).subscribe({
    next: (res: any) => {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Votre adresse e-mail a été vérifiée avec succès !',
      });
      this.signupForm.reset();
      this.showOtpModal = false;
      this.otpCode = '';
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.error?.message || 'Code OTP invalide ou expiré.',
      });
    }
  });
}

cancelOtp() {
  this.showOtpModal = false;
  this.otpCode = '';
}


}
