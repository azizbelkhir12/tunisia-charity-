import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

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
  title: string;
  description: string;
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
  token: string;
  expiresIn: string;
  data: {
    user: BackendUser;
    userType: BackendUserType;
  };
}

interface TokenPayload {
  id: string;
  email: string;
  userType: BackendUserType;
  role: string;
  iat?: number;
  exp?: number;
}

interface StoredUser {
  id: string;
  email: string;
  userType: BackendUserType;
  role: string;
  nom: string;
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
      title: 'Bénévole',
      description:
        'Donnez de votre temps et rejoignez nos missions sur le terrain.',
      icon: 'hand-heart',
      backendUserType: 'volunteer',
      perks: [
        'Missions près de chez vous',
        'Communauté engagée',
        'Suivi de vos heures',
      ],
    },
    {
      id: 'donateur',
      title: 'Donateur',
      description:
        "Suivez vos dons, téléchargez vos reçus fiscaux et l'impact réel.",
      icon: 'heart',
      backendUserType: 'donor',
      perks: [
        'Historique des dons',
        'Reçus fiscaux',
        "Rapports d'impact",
      ],
    },
    {
      id: 'beneficiaire',
      title: 'Bénéficiaire',
      description:
        "Accédez aux programmes d'aide et faites vos demandes en ligne.",
      icon: 'users',
      backendUserType: 'beneficiary',
      perks: [
        "Demandes d'aide",
        'Suivi de dossier',
        'Contact direct',
      ],
    },
  ];
  constructor(private readonly titleService: Title,
    private readonly metaService: Meta,
    private  authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initializePageMetadata();
  }

  private initializePageMetadata(): void {
    this.titleService.setTitle('Se connecter — Tunisia Charity');

    this.metaService.updateTag({
      name: 'description',
      content:
        'Connectez-vous à votre espace bénévole, donateur ou bénéficiaire.',
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: 'Se connecter — Tunisia Charity',
    });

    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Espace membre Tunisia Charity : bénévoles, donateurs et bénéficiaires.',
    });
  }


  selectRole(roleOrId: Role | RoleId): void {
  const role =
    typeof roleOrId === 'string'
      ? this.roles.find((item) => item.id === roleOrId) ?? null
      : roleOrId;

  if (!role) {
    return;
  }

  this.selectedRole = role;
  this.submitted = false;
  this.showPassword = false;
}

  changeRole(): void {
    this.selectedRole = null;
    this.submitted = false;
    this.showPassword = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.selectedRole) {
      this.errorMessage =
        'Veuillez sélectionner un profil.';
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage =
        'Veuillez saisir votre adresse email.';
      return;
    }

    if (!this.password) {
      this.errorMessage =
        'Veuillez saisir votre mot de passe.';
      return;
    }

    const credentials: LoginCredentials = {
      email: this.email.trim().toLowerCase(),
      password: this.password,
      userType: this.selectedRole.backendUserType,
    };

    this.isLoading = true;

    this.authService.login(credentials).subscribe({
      next: (response: LoginResponse) => {
        this.handleLoginSuccess(response);
      },
      error: (error) => {
        this.handleLoginError(error);
      },
    });
  }

  private handleLoginSuccess(
    response: LoginResponse,
  ): void {
    this.isLoading = false;

    if (
      !response.token ||
      !response.data?.user
    ) {
      this.errorMessage =
        'Réponse invalide reçue du serveur.';
      return;
    }

    const decodedToken =
      jwtDecode<TokenPayload>(response.token);

    const currentUser: StoredUser = {
      // Le backend utilise "id", pas "userId"
      id:
        decodedToken.id ||
        response.data.user._id,

      email:
        decodedToken.email ||
        response.data.user.email,

      userType:
        decodedToken.userType ||
        response.data.userType,

      role:
        decodedToken.role ||
        response.data.user.role ||
        'user',

      nom:
        response.data.user.nom || '',
    };

    localStorage.setItem(
      'token',
      response.token,
    );

    localStorage.setItem(
      'currentUser',
      JSON.stringify(currentUser),
    );

    this.redirectUser(currentUser.userType);
  }

  private handleLoginError(error: any): void {
    this.isLoading = false;

    if (error.status === 0) {
      this.errorMessage =
        'Impossible de contacter le serveur.';
      return;
    }

    if (error.status === 401) {
      this.errorMessage =
        error.error?.message ||
        'Email ou mot de passe incorrect.';
      return;
    }

    if (error.status === 400) {
      this.errorMessage =
        error.error?.message ||
        'Les informations envoyées sont invalides.';
      return;
    }

    this.errorMessage =
      error.error?.message ||
      'Une erreur est survenue pendant la connexion.';
  }

  private redirectUser(
    userType: BackendUserType,
  ): void {
    const routes: Record<
      BackendUserType,
      string
    > = {
      volunteer: '/benevole-compte',
      donor: '/donateur-compte',
      beneficiary: '/beneficiaire-compte',
      admin: '/admin-compte',
    };

    this.router.navigate([routes[userType]]);
  }

  private resetLoginState(): void {
    this.showPassword = false;
    this.isLoading = false;
    this.errorMessage = '';
  }

  trackRoleById(
    _index: number,
    role: Role,
  ): RoleId {
    return role.id;
  }

  trackPerk(
    _index: number,
    perk: string,
  ): string {
    return perk;
  }

  
}

