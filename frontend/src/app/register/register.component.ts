// register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PatternValidatorsService } from '../services/patternValidators/patern-validators.service';
import { ConfirmPasswordService } from '../services/confirm-password/confirm-password.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  activeTab: 'tab-content-1' | 'tab-content-2' = 'tab-content-1'; // Define the active tab

  username: string = '';
  email: string = '';
  password: string = '';
  successMessage: string = '';
  title: string = 'Up';
  titleS: string = 'Sign';
  errorMsg: string = "";
  path: string = "";
  user: any;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private AuthService: AuthService) { }

  signupForm: FormGroup = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(50),
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
    adress: new FormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(100),
      Validators.pattern(/^(?!\s+$).*$/)
    ]),
    zipCode: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{4}$/)
    ]),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\+216\d{8}$/)
    ]),
    status: new FormControl('standard'), // ✅ Add status field with default value
    img: new FormControl(''),
  }, { validators: ConfirmPasswordService.matchingPassword() });

  ngOnInit() {
    this.path = this.router.url;
  }

  // Function to set the active tab
  setActiveTab(tab: 'tab-content-1' | 'tab-content-2') {
    this.activeTab = tab;
  }

  onImageSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file) {
      this.signupForm.patchValue({ img: file });
      this.signupForm.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.signupForm.get('img')?.setErrors({ required: true });
    }
  }

  

  // Handle form submission
    // Handle form submission
    submit() {
      const donorData = {
      name: this.signupForm.get('name')?.value,
      email: this.signupForm.get('email')?.value,
      password: this.signupForm.get('password')?.value, 
      confirmPassword: this.signupForm.get('confirmPassword')?.value, // Add this
      address: this.signupForm.get('adress')?.value, // Fix typo to "address"
      zipCode: this.signupForm.get('zipCode')?.value,
      phone: this.signupForm.get('phone')?.value,
      status: this.signupForm.value.status, // Ensure selected status is saved
      img: this.signupForm.get('img')?.value ?? '', // Ensure it's not undefined
      };


      // Exclude confirmPassword before sending the request
      const { confirmPassword, ...donorDataWithoutConfirm } = this.signupForm.value;

      this.AuthService.register(donorData).subscribe(
      (response) => {
        this.successMessage = "Inscription réussie ! Vous pouvez maintenant vous connecter.";
        Swal.fire({
        icon: 'success',
        title: 'Inscription réussie',
        text: 'Vous pouvez maintenant vous connecter.',
        confirmButtonText: 'OK'
        });
      },
      (error) => {
        console.error('Signup failed', error);
        Swal.fire({
        icon: 'error',
        title: 'Échec de l\'inscription',
        text: 'Ces coordonnées sont déjà utilisées.',
        confirmButtonText: 'OK'
        });
      }
      );
    }
}