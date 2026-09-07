import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

// Utilise ici les noms réels de tes services.
import { DemandeService } from '../services/demande/demande.service';
import { AuthService } from '../services/auth/auth.service';

type RoleId = 'benevole' | 'donateur';
type DonorType = '' | 'standard' | 'parrain';
type PageStep = 'roles' | 'form' | 'otp' | 'success';

interface RoleOption {
  id: RoleId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

interface VolunteerForm {
  nom: string;
  prenom: string;
  age: number | null;
  email: string;
  motDePasse: string;
  confirmation: string;
  adresse: string;
  gouvernorat: string;
  telephone: string;
  motivation: string;
}

interface VolunteerPayload {
  name: string;
  Prenom: string;
  age: number;
  email: string;
  password: string;
  address: string;
  phone: string;
  gouvernorat: string;
  reason: string;
}

interface DonorForm {
  nomComplet: string;
  email: string;
  motDePasse: string;
  confirmation: string;
  adresse: string;
  codePostal: string;
  telephone: string;
  type: DonorType;
}

interface DonorPayload {
  name: string;
  email: string;
  password: string;
  address: string;
  zipCode: string;
  phone: string;
  type: Exclude<DonorType, ''>;
}

interface DonorTypeOption {
  id: Exclude<DonorType, ''>;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-benevolat',
  standalone: false,
  templateUrl: './benevolat.component.html',
  styleUrl: './benevolat.component.css',
})
export class BenevolatComponent implements OnInit {
  @ViewChildren('otpInput')
  otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly logoAssetUrl = 'assets/tunisia-charity-logo.jpeg';

  currentStep: PageStep = 'roles';
  selectedRole: RoleId | null = null;

  showVolunteerPassword = false;
  showVolunteerConfirmation = false;
  showDonorPassword = false;
  showDonorConfirmation = false;

  volunteerErrors: Record<string, string> = {};
  donorErrors: Record<string, string> = {};

  otpDigits: string[] = ['', '', '', '', '', ''];
  otpError = '';

  isSubmitting = false;
  apiError = '';

  volunteerForm: VolunteerForm = this.createEmptyVolunteerForm();

  donorForm: DonorForm = this.createEmptyDonorForm();

  readonly roles: RoleOption[] = [
    {
      id: 'benevole',
      titleKey: 'JOIN_PAGE.ROLES.VOLUNTEER.TITLE',
      descriptionKey: 'JOIN_PAGE.ROLES.VOLUNTEER.DESCRIPTION',
      icon: 'hand-heart',
    },
    {
      id: 'donateur',
      titleKey: 'JOIN_PAGE.ROLES.DONOR.TITLE',
      descriptionKey: 'JOIN_PAGE.ROLES.DONOR.DESCRIPTION',
      icon: 'heart',
    },
  ];

  readonly donorTypes: DonorTypeOption[] = [
    {
      id: 'standard',
      titleKey: 'JOIN_PAGE.DONOR.TYPES.STANDARD.TITLE',
      descriptionKey: 'JOIN_PAGE.DONOR.TYPES.STANDARD.DESCRIPTION',
    },
    {
      id: 'parrain',
      titleKey: 'JOIN_PAGE.DONOR.TYPES.SPONSOR.TITLE',
      descriptionKey: 'JOIN_PAGE.DONOR.TYPES.SPONSOR.DESCRIPTION',
    },
  ];

  readonly gouvernorats: string[] = [
    'Ariana',
    'Béja',
    'Ben Arous',
    'Bizerte',
    'Gabès',
    'Gafsa',
    'Jendouba',
    'Kairouan',
    'Kasserine',
    'Kébili',
    'Le Kef',
    'Mahdia',
    'Manouba',
    'Médenine',
    'Monastir',
    'Nabeul',
    'Sfax',
    'Sidi Bouzid',
    'Siliana',
    'Sousse',
    'Tataouine',
    'Tozeur',
    'Tunis',
    'Zaghouan',
  ];

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly demandeService: DemandeService,
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.configurePageMetadata();
  }

  get otpCode(): string {
    return this.otpDigits
      .map((digit) =>
        String(digit ?? '')
          .replace(/\D/g, '')
          .slice(0, 1),
      )
      .join('');
  }

  trackOtpByIndex(index: number): number {
    return index;
  }

  get otpEmail(): string {
    return this.volunteerForm.email.trim().toLowerCase();
  }

  private resetOtp(): void {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
  }

  get successMessage(): string {
    if (this.selectedRole === 'donateur') {
      return this.translate.instant('JOIN_PAGE.SUCCESS.DONOR_MESSAGE');
    }

    return this.translate.instant('JOIN_PAGE.SUCCESS.VOLUNTEER_MESSAGE');
  }

  selectRole(role: RoleId): void {
    this.selectedRole = role;
    this.currentStep = 'form';

    this.apiError = '';
    this.resetOtp();

    this.volunteerErrors = {};
    this.donorErrors = {};
  }

  changeRole(): void {
    this.selectedRole = null;
    this.currentStep = 'roles';

    this.volunteerForm = this.createEmptyVolunteerForm();

    this.donorForm = this.createEmptyDonorForm();

    this.volunteerErrors = {};
    this.donorErrors = {};

    this.showVolunteerPassword = false;
    this.showVolunteerConfirmation = false;
    this.showDonorPassword = false;
    this.showDonorConfirmation = false;

    this.apiError = '';
    this.resetOtp();
  }

  backToForm(): void {
    this.currentStep = 'form';
    this.apiError = '';
    this.resetOtp();
  }

  selectDonorType(type: Exclude<DonorType, ''>): void {
    this.donorForm.type = type;
    delete this.donorErrors['type'];
  }

  toggleVolunteerPassword(): void {
    this.showVolunteerPassword = !this.showVolunteerPassword;
  }

  toggleVolunteerConfirmation(): void {
    this.showVolunteerConfirmation = !this.showVolunteerConfirmation;
  }

  toggleDonorPassword(): void {
    this.showDonorPassword = !this.showDonorPassword;
  }

  toggleDonorConfirmation(): void {
    this.showDonorConfirmation = !this.showDonorConfirmation;
  }


  submitVolunteer(): void {
    this.apiError = '';
    this.otpError = '';

    if (!this.validateVolunteerForm()) {
      return;
    }

    const volunteerData = this.buildVolunteerPayload();

    this.isSubmitting = true;

    this.demandeService
      .Demande(volunteerData)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.resetOtp();
          this.currentStep = 'otp';

          setTimeout(() => {
            this.otpInputs.first?.nativeElement.focus();
          });
        },

        error: (error) => {
          console.error('Erreur requestOtp :', error?.status, error?.error);

          this.apiError =
            error?.error?.message ||
            this.translate.instant('JOIN_PAGE.ERRORS.SEND_OTP');
        },
      });
  }

  submitDonor(): void {
    this.apiError = '';

    if (!this.validateDonorForm()) {
      return;
    }

    const donorData = this.buildDonorPayload();

    this.isSubmitting = true;

    this.authService
      .register(donorData)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.currentStep = 'success';
        },

        error: (error) => {
          console.error(
            'Erreur inscription donateur :',
            error?.status,
            error?.error,
          );

          this.apiError =
            error?.error?.message ||
            error?.error?.error ||
            this.translate.instant('JOIN_PAGE.ERRORS.REGISTER_DONOR');
        },
      });
  }

 
  verifyVolunteerOtp(): void {
    this.otpError = '';
    this.apiError = '';

    const otp = this.otpCode;

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      this.otpError = this.translate.instant(
        'JOIN_PAGE.VALIDATION.OTP_COMPLETE',
      );

      return;
    }

    const email = this.volunteerForm.email.trim().toLowerCase();

    this.isSubmitting = true;

    this.demandeService
      .verifyOtp(email, otp)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.currentStep = 'success';
        },

        error: (error) => {
          console.error(
            'Erreur vérification OTP :',
            error?.status,
            error?.error,
          );

          const message = error?.error?.message;

          switch (message) {
            case 'Invalid OTP':
              this.otpError = this.translate.instant(
                'JOIN_PAGE.VALIDATION.OTP_INVALID',
              );
              break;

            case 'OTP expired':
              this.otpError = this.translate.instant(
                'JOIN_PAGE.VALIDATION.OTP_EXPIRED',
              );
              break;

            case 'User not found':
              this.otpError = this.translate.instant(
                'JOIN_PAGE.VALIDATION.OTP_USER_NOT_FOUND',
              );
              break;

            case 'User already verified':
              this.otpError = this.translate.instant(
                'JOIN_PAGE.VALIDATION.OTP_ALREADY_VERIFIED',
              );
              break;

            default:
              this.otpError =
                message ||
                this.translate.instant('JOIN_PAGE.VALIDATION.OTP_VERIFY');
          }
        },
      });
  }

  handleOtpChange(value: string, index: number): void {
    const digit = String(value ?? '')
      .replace(/\D/g, '')
      .slice(-1);

    const updatedDigits = [...this.otpDigits];

    updatedDigits[index] = digit;

    this.otpDigits = updatedDigits;

    this.otpError = '';
    this.apiError = '';

    if (digit && index < this.otpDigits.length - 1) {
      setTimeout(() => {
        this.otpInputs.get(index + 1)?.nativeElement.focus();
      });
    }
  }

  handleOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      event.preventDefault();

      const updatedDigits = [...this.otpDigits];

      if (updatedDigits[index]) {
        updatedDigits[index] = '';
        this.otpDigits = updatedDigits;
        return;
      }

      if (index > 0) {
        updatedDigits[index - 1] = '';
        this.otpDigits = updatedDigits;

        setTimeout(() => {
          this.otpInputs.get(index - 1)?.nativeElement.focus();
        });
      }

      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();

      this.otpInputs.get(index - 1)?.nativeElement.focus();

      return;
    }

    if (event.key === 'ArrowRight' && index < this.otpDigits.length - 1) {
      event.preventDefault();

      this.otpInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  handleOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pastedCode =
      event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';

    if (!pastedCode) {
      return;
    }

    this.otpDigits = Array.from(
      {
        length: 6,
      },
      (_, index) => pastedCode[index] ?? '',
    );

    this.otpError = '';
    this.apiError = '';

    setTimeout(() => {
      const targetIndex = Math.min(pastedCode.length, 6) - 1;

      this.otpInputs.get(Math.max(targetIndex, 0))?.nativeElement.focus();
    });
  }

  trackRoleById(index: number, role: RoleOption): RoleId {
    return role.id;
  }

  trackDonorTypeById(index: number, option: DonorTypeOption): string {
    return option.id;
  }

  trackGouvernorat(index: number, gouvernorat: string): string {
    return gouvernorat;
  }

  private buildVolunteerPayload(): VolunteerPayload {
    if (this.volunteerForm.age === null) {
      throw new Error(
        this.translate.instant('JOIN_PAGE.VALIDATION.AGE_REQUIRED_PAYLOAD'),
      );
    }

    return {
      name: this.volunteerForm.nom.trim(),

      Prenom: this.volunteerForm.prenom.trim(),

      age: Number(this.volunteerForm.age),

      email: this.volunteerForm.email.trim().toLowerCase(),

      password: this.volunteerForm.motDePasse,

      address: this.volunteerForm.adresse.trim(),

      phone: this.volunteerForm.telephone.replace(/\s/g, ''),

      gouvernorat: this.volunteerForm.gouvernorat.trim(),

      reason: this.volunteerForm.motivation.trim(),
    };
  }

  private buildDonorPayload(): DonorPayload {
    if (!this.donorForm.type) {
      throw new Error(
        this.translate.instant(
          'JOIN_PAGE.VALIDATION.DONOR_TYPE_REQUIRED_PAYLOAD',
        ),
      );
    }

    return {
      name: this.donorForm.nomComplet.trim(),

      email: this.donorForm.email.trim().toLowerCase(),

      password: this.donorForm.motDePasse,

      address: this.donorForm.adresse.trim(),

      zipCode: this.donorForm.codePostal.trim(),

      phone: this.donorForm.telephone.replace(/\s/g, ''),

      type: this.donorForm.type,
    };
  }

  private validateVolunteerForm(): boolean {
    const errors: Record<string, string> = {};
    const form = this.volunteerForm;

    if (!form.nom.trim()) {
      errors['nom'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.LAST_NAME_REQUIRED',
      );
    }

    if (!form.prenom.trim()) {
      errors['prenom'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.FIRST_NAME_REQUIRED',
      );
    }

    if (form.age === null || form.age === undefined) {
      errors['age'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.AGE_REQUIRED',
      );
    } else if (!Number.isInteger(form.age) || form.age < 16 || form.age > 100) {
      errors['age'] = this.translate.instant('JOIN_PAGE.VALIDATION.AGE_RANGE');
    }

    if (!form.email.trim()) {
      errors['email'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.EMAIL_REQUIRED',
      );
    } else if (!this.isValidEmail(form.email)) {
      errors['email'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.EMAIL_INVALID',
      );
    }

    if (!form.motDePasse) {
      errors['motDePasse'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PASSWORD_REQUIRED',
      );
    } else if (form.motDePasse.length < 8) {
      errors['motDePasse'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PASSWORD_MIN',
      );
    }

    if (!form.confirmation) {
      errors['confirmation'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.CONFIRM_REQUIRED',
      );
    } else if (form.confirmation !== form.motDePasse) {
      errors['confirmation'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.CONFIRM_MATCH',
      );
    }

    if (!form.adresse.trim()) {
      errors['adresse'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.ADDRESS_REQUIRED',
      );
    }

    if (!form.gouvernorat) {
      errors['gouvernorat'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.GOVERNORATE_REQUIRED',
      );
    }

    if (!form.telephone.trim()) {
      errors['telephone'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PHONE_REQUIRED',
      );
    } else if (!this.isValidPhone(form.telephone)) {
      errors['telephone'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PHONE_INVALID',
      );
    }

    if (!form.motivation.trim()) {
      errors['motivation'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.MOTIVATION_REQUIRED',
      );
    }

    this.volunteerErrors = errors;

    return Object.keys(errors).length === 0;
  }

  private validateDonorForm(): boolean {
    const errors: Record<string, string> = {};
    const form = this.donorForm;

    if (!form.nomComplet.trim()) {
      errors['nomComplet'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.FULL_NAME_REQUIRED',
      );
    }

    if (!form.email.trim()) {
      errors['email'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.EMAIL_REQUIRED',
      );
    } else if (!this.isValidEmail(form.email)) {
      errors['email'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.EMAIL_INVALID',
      );
    }

    if (!form.motDePasse) {
      errors['motDePasse'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PASSWORD_REQUIRED',
      );
    } else if (form.motDePasse.length < 8) {
      errors['motDePasse'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PASSWORD_MIN',
      );
    }

    if (!form.confirmation) {
      errors['confirmation'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.CONFIRM_REQUIRED',
      );
    } else if (form.confirmation !== form.motDePasse) {
      errors['confirmation'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.CONFIRM_MATCH',
      );
    }

    if (!form.adresse.trim()) {
      errors['adresse'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.ADDRESS_REQUIRED',
      );
    }

    if (!form.codePostal.trim()) {
      errors['codePostal'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.POSTAL_REQUIRED',
      );
    } else if (!/^[0-9]{4,5}$/.test(form.codePostal.trim())) {
      errors['codePostal'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.POSTAL_INVALID',
      );
    }

    if (!form.telephone.trim()) {
      errors['telephone'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PHONE_REQUIRED',
      );
    } else if (!this.isValidPhone(form.telephone)) {
      errors['telephone'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.PHONE_INVALID',
      );
    }

    if (!form.type) {
      errors['type'] = this.translate.instant(
        'JOIN_PAGE.VALIDATION.DONOR_TYPE_REQUIRED',
      );
    }

    this.donorErrors = errors;

    return Object.keys(errors).length === 0;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isValidPhone(phone: string): boolean {
    return /^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, ''));
  }

  private createEmptyVolunteerForm(): VolunteerForm {
    return {
      nom: '',
      prenom: '',
      age: null,
      email: '',
      motDePasse: '',
      confirmation: '',
      adresse: '',
      gouvernorat: '',
      telephone: '',
      motivation: '',
    };
  }

  private createEmptyDonorForm(): DonorForm {
    return {
      nomComplet: '',
      email: '',
      motDePasse: '',
      confirmation: '',
      adresse: '',
      codePostal: '',
      telephone: '',
      type: '',
    };
  }

  
  private configurePageMetadata(): void {
    this.titleService.setTitle('Rejoignez-nous — Tunisia Charity');

    this.metaService.updateTag({
      name: 'description',
      content: 'Devenez bénévole ou donateur auprès de Tunisia Charity.',
    });
  }
}
