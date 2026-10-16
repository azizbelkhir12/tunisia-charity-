import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

type RoleId =
  | 'benevole'
  | 'donateur'
  | 'beneficiaire';

type BackendUserType =
  | 'volunteer'
  | 'donor'
  | 'beneficiary'
  | 'admin';

interface Role {
  id: RoleId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  perks: string[];
  backendUserType: BackendUserType;
}

interface LoginCredentials {
  email: string;
  password: string;
  userType: BackendUserType;
}

interface BackendUser {
  _id: string;
  email: string;
  nom?: string;
  role?: string;
  [key: string]: any;
}

interface LoginResponse {
  status: 'success' | 'fail' | 'error';
  expiresIn: string;
  data: {
    user: BackendUser;
    userType: BackendUserType;
  };
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{

  selectedRole: Role | null = null;

  email = '';
  password = '';
  rememberMe = false;

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  submitted = false;

  readonly roles: Role[] = [

    {
      id: 'benevole',

      titleKey:
        'LOGIN_PAGE.ROLES.VOLUNTEER.TITLE',

      descriptionKey:
        'LOGIN_PAGE.ROLES.VOLUNTEER.DESCRIPTION',

      icon: 'hand-heart',

      backendUserType: 'volunteer',

      perks: [
        'LOGIN_PAGE.ROLES.VOLUNTEER.PERKS.NEARBY_MISSIONS',
        'LOGIN_PAGE.ROLES.VOLUNTEER.PERKS.COMMUNITY',
        'LOGIN_PAGE.ROLES.VOLUNTEER.PERKS.HOURS'
      ]
    },

    {
      id: 'donateur',

      titleKey:
        'LOGIN_PAGE.ROLES.DONOR.TITLE',

      descriptionKey:
        'LOGIN_PAGE.ROLES.DONOR.DESCRIPTION',

      icon: 'heart',

      backendUserType: 'donor',

      perks: [
        'LOGIN_PAGE.ROLES.DONOR.PERKS.DONATION_HISTORY',
        'LOGIN_PAGE.ROLES.DONOR.PERKS.TAX_RECEIPTS',
        'LOGIN_PAGE.ROLES.DONOR.PERKS.IMPACT_REPORTS'
      ]
    },

    {
      id: 'beneficiaire',

      titleKey:
        'LOGIN_PAGE.ROLES.BENEFICIARY.TITLE',

      descriptionKey:
        'LOGIN_PAGE.ROLES.BENEFICIARY.DESCRIPTION',

      icon: 'users',

      backendUserType: 'beneficiary',

      perks: [
        'LOGIN_PAGE.ROLES.BENEFICIARY.PERKS.AID_REQUESTS',
        'LOGIN_PAGE.ROLES.BENEFICIARY.PERKS.CASE_TRACKING',
        'LOGIN_PAGE.ROLES.BENEFICIARY.PERKS.DIRECT_CONTACT'
      ]
    }

  ];


  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}


  ngOnInit(): void {
    this.initializePageMetadata();
  }


  
  private initializePageMetadata(): void {

    this.titleService.setTitle(
      'Se connecter — Tunisia Charity'
    );

    this.metaService.updateTag({
      name: 'description',
      content:
        'Connectez-vous à votre espace bénévole, donateur ou bénéficiaire.'
    });

    this.metaService.updateTag({
      property: 'og:title',
      content:
        'Se connecter — Tunisia Charity'
    });

    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Espace membre Tunisia Charity : bénévoles, donateurs et bénéficiaires.'
    });
  }


  selectRole(roleOrId: Role | RoleId): void {

    const role =
      typeof roleOrId === 'string'
        ? this.roles.find(
            (item) => item.id === roleOrId
          ) ?? null
        : roleOrId;

    if (!role) {
      return;
    }

    this.selectedRole = role;

    this.submitted = false;
    this.showPassword = false;
    this.errorMessage = '';
  }


  changeRole(): void {

    this.selectedRole = null;

    this.submitted = false;
    this.showPassword = false;
    this.errorMessage = '';
  }


  togglePasswordVisibility(): void {

    this.showPassword =
      !this.showPassword;
  }


  onSubmit(): void {

    this.errorMessage = '';
    this.submitted = false;


    if (!this.selectedRole) {

      this.errorMessage =
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.SELECT_PROFILE'
        );

      return;
    }


    if (!this.email.trim()) {

      this.errorMessage =
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.EMAIL_REQUIRED'
        );

      return;
    }


    if (!this.password) {

      this.errorMessage =
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.PASSWORD_REQUIRED'
        );

      return;
    }


    const credentials: LoginCredentials = {

      email:
        this.email
          .trim()
          .toLowerCase(),

      password:
        this.password,

      userType:
        this.selectedRole.backendUserType
    };


    this.isLoading = true;


    this.authService
      .login(credentials)
      .subscribe({

        next: (response: LoginResponse) => {

          this.handleLoginSuccess(
            response
          );

        },

        error: (error) => {

          this.handleLoginError(
            error
          );

        }

      });
  }


  private handleLoginSuccess(
    response: LoginResponse
  ): void {

    this.isLoading = false;


    if (!response.data?.user) {

      this.errorMessage =
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.INVALID_SERVER_RESPONSE'
        );

      return;
    }


    try {
      const backendUser = response.data.user;
      const currentUser = {
        ...backendUser,
        id: backendUser['id'] || backendUser._id,
        userType: response.data.userType,
        role: backendUser.role || 'user'
      };

      this.authService.setCurrentUser(
        currentUser
      );


      // Navigation
      this.redirectUser(
        currentUser.userType
      );

    } catch (error) {

      console.error(
        'Erreur pendant le traitement du token:',
        error
      );

      this.errorMessage =
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.LOGIN_PROCESS'
        );
    }
  }


  private handleLoginError(
    error: any
  ): void {

    this.isLoading = false;


    if (error.status === 0) {

      this.errorMessage =
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.SERVER_UNAVAILABLE'
        );

      return;
    }


    if (error.status === 401) {

      this.errorMessage =
        error.error?.message ||
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.INVALID_CREDENTIALS'
        );

      return;
    }


    if (error.status === 400) {

      this.errorMessage =
        error.error?.message ||
        this.translate.instant(
          'LOGIN_PAGE.ERRORS.INVALID_INFORMATION'
        );

      return;
    }


    this.errorMessage =
      error.error?.message ||
      this.translate.instant(
        'LOGIN_PAGE.ERRORS.GENERIC'
      );
  }


  private redirectUser(
    userType: BackendUserType
  ): void {

    const routes: Record<
      BackendUserType,
      string
    > = {

      volunteer:
        '/benevole-compte',

      donor:
        '/donateur-compte',

      beneficiary:
        '/beneficiaire-compte',

      admin:
        '/admin-compte'
    };


    this.router.navigate([
      routes[userType]
    ]);
  }


  private resetLoginState(): void {

    this.showPassword = false;
    this.isLoading = false;
    this.errorMessage = '';
    this.submitted = false;
  }


  trackRoleById(
    _index: number,
    role: Role
  ): RoleId {

    return role.id;
  }


  trackPerk(
    _index: number,
    perk: string
  ): string {

    return perk;
  }
  
}

