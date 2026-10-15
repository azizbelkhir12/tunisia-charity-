import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import { NotificationService } from '../services/notification/notification.service';
import { AuthService } from '../services/auth/auth.service';

type TabId = 'profil' | 'abonnement' | 'paiements' | 'notifications';

type PaymentStatus = 'Réussi' | 'Échoué' | 'En attente';

type PaymentFilter = 'Tous' | PaymentStatus;

interface BenevoleProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  gouvernorat: string;
  equipe: string;
  adresse: string;
  age: number;
  photo: string;
}

interface Paiement {
  id: number;
  date: string;
  montant: number;
  methode: string;
  status: PaymentStatus;
}

interface NotificationItem {
  id: string;
  titre: string;
  contenu: string;
  date: string;
  type: string;
  read: boolean;
}

interface NavigationItem {
  id: TabId;
  label: string;
  icon: string;
}

interface PaymentMethod {
  id: 'carte' | 'virement' | 'cash';
  label: string;
  description: string;
  icon: string;
}
@Component({
  selector: 'app-benevole-compte',
  standalone: false,
  templateUrl: './benevole-compte.component.html',
  styleUrl: './benevole-compte.component.css',
})
export class BenevoleCompteComponent {
  /* =====================================================
     GENERAL
  ===================================================== */

  activeTab: TabId = 'profil';

  currentVolunteerId: string | null = null;

  volunteerLoading = false;
  volunteerLoadError = '';

  notificationLoading = false;
  notificationLoadError = '';

  savingProfile = false;

  readonly montantAbonnement = 60;

  /* =====================================================
     NAVIGATION
  ===================================================== */

  readonly navigationItems: NavigationItem[] = [
    {
      id: 'profil',
      label: 'Mon profil',
      icon: 'user',
    },
    {
      id: 'abonnement',
      label: 'Abonnement',
      icon: 'credit-card',
    },
    {
      id: 'paiements',
      label: 'Historique de paiements',
      icon: 'receipt',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'bell',
    },
  ];

  /* =====================================================
     LISTES
  ===================================================== */

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

  readonly equipes: string[] = [
    'Équipe logistique',
    'Équipe éducation',
    'Équipe santé',
    'Équipe collecte',
    'Équipe communication',
  ];

  /* =====================================================
     PROFILE
  ===================================================== */

  profile: BenevoleProfile = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    gouvernorat: '',
    equipe: '',
    adresse: '',
    age: 0,
    photo: '',
  };

  profileDraft: BenevoleProfile = {
    ...this.profile,
  };

  private rawVolunteer: any = null;

  profileEditing = false;
  profileSaved = false;
  profileError = '';

  selectedPhotoFile: File | null = null;

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  notifications: NotificationItem[] = [];

  readNotificationIds: string[] = [];

  notificationQuery = '';

  readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'carte',
      label: 'Carte bancaire',
      icon: 'credit-card',
      description: 'Paiement sécurisé en ligne',
    },
    {
      id: 'virement',
      label: 'Virement',
      icon: 'banknote',
      description: "Virement bancaire vers l'association",
    },
    {
      id: 'cash',
      label: 'Cash',
      icon: 'wallet',
      description: "Règlement au local de l'association",
    },
  ];

  selectedPaymentMethod: PaymentMethod['id'] = 'carte';

  paymentName = '';
  paymentEmail = '';
  paymentError = '';
  paymentDone = false;

  paiements: Paiement[] = [];

  paymentFilter: PaymentFilter = 'Tous';

  readonly paymentFilters: PaymentFilter[] = [
    'Tous',
    'Réussi',
    'Échoué',
    'En attente',
  ];

  constructor(
    private volunteerService: VolunteerService,
    private notificationService: NotificationService,
    private authService: AuthService,
  ) {}

  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {
    this.currentVolunteerId = this.authService.getCurrentUserId();

    if (!this.currentVolunteerId) {
      this.volunteerLoadError =
        'Impossible de récupérer l’utilisateur connecté.';
      return;
    }

    this.loadVolunteer();

    this.loadNotifications();
  }

  /* =====================================================
     LOAD VOLUNTEER
  ===================================================== */

  loadVolunteer(): void {
    if (!this.currentVolunteerId) {
      return;
    }

    this.volunteerLoading = true;
    this.volunteerLoadError = '';

    this.volunteerService
      .getVolunteerById(this.currentVolunteerId)
      .pipe(
        finalize(() => {
          this.volunteerLoading = false;
        }),
      )
      .subscribe({
        next: (response: any) => {

          const volunteer = this.extractVolunteer(response);

          if (!volunteer) {
            this.volunteerLoadError = 'Aucune information bénévole trouvée.';
            return;
          }

          this.rawVolunteer = volunteer;

          this.profile = this.mapVolunteerToProfile(volunteer);

          this.profileDraft = {
            ...this.profile,
          };

          this.paymentName =
            `${this.profile.prenom} ${this.profile.nom}`.trim();

          this.paymentEmail = this.profile.email;
        },

        error: (error) => {
          console.error('Erreur chargement bénévole:', error);

          this.volunteerLoadError =
            'Impossible de charger les informations du bénévole.';
        },
      });
  }

  /**
   * Supporte plusieurs formes de réponses backend :
   *
   * { volunteer: {...} }
   * { data: {...} }
   * { data: { volunteer: {...} } }
   * [{...}]
   * {...}
   */
  private extractVolunteer(response: any): any {
    if (!response) {
      return null;
    }

    if (Array.isArray(response)) {
      return response.length ? response[0] : null;
    }

    if (response.volunteer) {
      return response.volunteer;
    }

    if (response.data?.volunteer) {
      return response.data.volunteer;
    }

    if (response.data && !Array.isArray(response.data)) {
      return response.data;
    }

    return response;
  }

  /**
   * J'ai volontairement supporté plusieurs noms de champs,
   * par exemple :
   *
   * name / prenom
   * lastname / nom
   * phoneNumber / telephone
   * address / adresse
   * Age / age
   *
   * Cela évite que le front reste vide si ton modèle MongoDB
   * utilise les noms anglais.
   */
  private mapVolunteerToProfile(volunteer: any): BenevoleProfile {
    return {
      nom: volunteer.lastname ?? volunteer.lastName ?? volunteer.nom ?? '',

      prenom: volunteer.name ?? volunteer.firstName ?? volunteer.prenom ?? '',

      email: volunteer.email ?? '',

      telephone:
        volunteer.phoneNumber ?? volunteer.telephone ?? volunteer.phone ?? '',

      gouvernorat: volunteer.gouvernorat ?? '',

      equipe:
        volunteer.equipe?.nom ??
        volunteer.equipe?.name ??
        volunteer.equipe ??
        volunteer.team?.name ??
        volunteer.team ??
        '',

      adresse: volunteer.address ?? volunteer.adresse ?? '',

      age: Number(volunteer.Age ?? volunteer.age ?? 0),

      photo: volunteer.photoUrl ?? volunteer.photo ?? volunteer.imageUrl ?? '',
    };
  }

  /* =====================================================
     PROFILE EDIT
  ===================================================== */

  startProfileEdit(): void {
    this.profileDraft = {
      ...this.profile,
    };

    this.selectedPhotoFile = null;

    this.profileEditing = true;
    this.profileSaved = false;
    this.profileError = '';
  }

  cancelProfileEdit(): void {
    this.profileDraft = {
      ...this.profile,
    };

    this.selectedPhotoFile = null;

    this.profileEditing = false;
    this.profileError = '';
  }

  /* =====================================================
     PHOTO
  ===================================================== */

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.profileError = 'La photo doit être au format JPG ou PNG.';

      input.value = '';

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.profileError = 'La photo ne doit pas dépasser 2 Mo.';

      input.value = '';

      return;
    }

    this.selectedPhotoFile = file;

    /*
     * Affichage immédiat de la preview
     * avant même l'envoi au backend.
     */
    const reader = new FileReader();

    reader.onload = () => {
      this.profileDraft.photo = reader.result as string;

      this.profileError = '';
    };

    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.profileDraft.photo = '';

    this.selectedPhotoFile = null;
  }

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  saveProfile(): void {
    if (!this.currentVolunteerId) {
      this.profileError = 'Utilisateur introuvable.';

      return;
    }

    this.profileError = '';

    if (!this.profileDraft.nom.trim() || !this.profileDraft.prenom.trim()) {
      this.profileError = 'Veuillez saisir votre nom et votre prénom.';

      return;
    }

    if (!this.profileDraft.email || !this.profileDraft.email.includes('@')) {
      this.profileError = 'Veuillez saisir un email valide.';

      return;
    }

    if (!this.profileDraft.telephone.trim()) {
      this.profileError = 'Veuillez saisir votre numéro de téléphone.';

      return;
    }

    if (this.profileDraft.age < 16 || this.profileDraft.age > 120) {
      this.profileError = 'Veuillez saisir un âge valide (16-120).';

      return;
    }

    if (!this.profileDraft.adresse.trim()) {
      this.profileError = 'Veuillez saisir votre adresse.';

      return;
    }

    const updateData = this.buildUpdatePayload();

    this.savingProfile = true;

    this.volunteerService
      .updateVolunteer(this.currentVolunteerId, updateData)
      .pipe(
        /*
         * Si une nouvelle photo a été choisie,
         * on l'envoie seulement après que la modification
         * du profil a réussi.
         */
        switchMap(() => {
          if (!this.selectedPhotoFile || !this.currentVolunteerId) {
            return of(null);
          }

          return this.volunteerService.uploadPhoto(
            this.currentVolunteerId,
            this.selectedPhotoFile,
          );
        }),

        finalize(() => {
          this.savingProfile = false;
        }),
      )
      .subscribe({
        next: () => {
          this.profileEditing = false;
          this.profileSaved = true;

          this.selectedPhotoFile = null;

          /*
           * On recharge depuis MongoDB au lieu de simplement
           * réutiliser les données locales.
           *
           * Ainsi l'écran affiche exactement ce qui est
           * réellement stocké dans le backend.
           */
          this.loadVolunteer();
        },

        error: (error) => {
          console.error('Erreur mise à jour bénévole:', error);

          this.profileError =
            error?.error?.message ||
            'Impossible de mettre à jour vos informations.';
        },
      });
  }

  /**
   * Cette fonction s'adapte aux noms de propriétés
   * réellement présents dans ton objet backend.
   */
  private buildUpdatePayload(): any {
    const payload: any = {};

    this.setBackendField(
      payload,
      ['name', 'firstName', 'prenom'],
      this.profileDraft.prenom,
      'name',
    );

    this.setBackendField(
      payload,
      ['lastname', 'lastName', 'nom'],
      this.profileDraft.nom,
      'lastname',
    );

    this.setBackendField(payload, ['email'], this.profileDraft.email, 'email');

    this.setBackendField(
      payload,
      ['phoneNumber', 'telephone', 'phone'],
      this.profileDraft.telephone,
      'phoneNumber',
    );

    this.setBackendField(
      payload,
      ['gouvernorat'],
      this.profileDraft.gouvernorat,
      'gouvernorat',
    );

    this.setBackendField(
      payload,
      ['address', 'adresse'],
      this.profileDraft.adresse,
      'address',
    );

    this.setBackendField(payload, ['Age', 'age'], this.profileDraft.age, 'Age');

    /*
     * Seulement si ton Volunteer possède réellement equipe/team.
     */
    if (this.rawVolunteer?.equipe !== undefined) {
      payload.equipe = this.profileDraft.equipe;
    } else if (this.rawVolunteer?.team !== undefined) {
      payload.team = this.profileDraft.equipe;
    }

    return payload;
  }

  private setBackendField(
    payload: any,
    possibleKeys: string[],
    value: any,
    defaultKey: string,
  ): void {
    const existingKey = possibleKeys.find(
      (key) => this.rawVolunteer && this.rawVolunteer[key] !== undefined,
    );

    payload[existingKey ?? defaultKey] = value;
  }

  /* =====================================================
     AVATAR
  ===================================================== */

  getInitials(profile: BenevoleProfile): string {
    const first = profile.prenom?.charAt(0)?.toUpperCase() ?? '';

    const last = profile.nom?.charAt(0)?.toUpperCase() ?? '';

    return first + last;
  }

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  loadNotifications(): void {
    if (!this.currentVolunteerId) {
      return;
    }

    this.notificationLoading = true;
    this.notificationLoadError = '';

    this.notificationService
      .getNotificationById(this.currentVolunteerId)
      .pipe(
        finalize(() => {
          this.notificationLoading = false;
        }),
      )
      .subscribe({
        next: (response: any) => {

          const notifications = this.extractNotifications(response);

          this.notifications = notifications.map(
            (notification: any, index: number) =>
              this.mapNotification(notification, index),
          );

          this.readNotificationIds = this.notifications
            .filter((notification) => notification.read)
            .map((notification) => notification.id);
        },

        error: (error) => {
          console.error('Erreur notifications:', error);

          this.notificationLoadError =
            'Impossible de charger les notifications.';
        },
      });
  }

  private extractNotifications(response: any): any[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.notifications)) {
      return response.notifications;
    }

    if (Array.isArray(response.data?.notifications)) {
      return response.data.notifications;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }

  private mapNotification(notification: any, index: number): NotificationItem {
    return {
      id: String(notification._id ?? notification.id ?? index),

      titre: notification.titre ?? notification.title ?? 'Notification',

      contenu:
        notification.contenu ??
        notification.content ??
        notification.message ??
        '',

      date:
        notification.date ?? notification.createdAt ?? new Date().toISOString(),

      type: notification.type ?? 'Notification',

      read: Boolean(
        notification.read ??
        notification.isRead ??
        notification.lu ??
        notification.seen ??
        false,
      ),
    };
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(
      (notification) => !this.readNotificationIds.includes(notification.id),
    ).length;
  }

  isNotificationRead(id: string): boolean {
    return this.readNotificationIds.includes(id);
  }

  /**
   * Ton service actuel ne possède pas de méthode backend
   * permettant de marquer UNE notification comme lue.
   *
   * Donc cette opération reste locale.
   */
  markNotificationAsRead(id: string): void {
    if (this.readNotificationIds.includes(id)) {
      return;
    }

    this.readNotificationIds = [...this.readNotificationIds, id];

    const notification = this.notifications.find((item) => item.id === id);

    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Ici, par contre, ton service dispose bien d'un endpoint.
   */
  markAllNotificationsAsRead(): void {
    if (!this.currentVolunteerId) {
      return;
    }

    this.notificationService
      .markAllNotificationsAsRead(this.currentVolunteerId)
      .subscribe({
        next: () => {
          this.readNotificationIds = this.notifications.map(
            (notification) => notification.id,
          );

          this.notifications = this.notifications.map((notification) => ({
            ...notification,
            read: true,
          }));
        },

        error: (error) => {
          console.error('Erreur mark all as read:', error);
        },
      });
  }

  get filteredNotifications(): NotificationItem[] {
    const query = this.notificationQuery.trim().toLowerCase();

    if (!query) {
      return this.notifications;
    }

    return this.notifications.filter(
      (notification) =>
        notification.titre.toLowerCase().includes(query) ||
        notification.contenu.toLowerCase().includes(query),
    );
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  selectTab(tab: TabId): void {
    this.activeTab = tab;

    if (tab === 'notifications') {
      /*
       * On recharge les notifications quand l'utilisateur
       * revient sur l'onglet.
       */
      this.loadNotifications();
    }

    if (tab === 'abonnement') {
      this.paymentError = '';
      this.paymentDone = false;

      this.paymentName = `${this.profile.prenom} ${this.profile.nom}`.trim();

      this.paymentEmail = this.profile.email;
    }
  }

  /* =====================================================
     PAYMENT
     TEMPORAIREMENT LOCAL
  ===================================================== */

  selectPaymentMethod(method: PaymentMethod['id']): void {
    this.selectedPaymentMethod = method;
  }

  submitSubscription(): void {
    this.paymentError = '';

    if (!this.paymentName.trim()) {
      this.paymentError = 'Veuillez saisir votre nom complet.';

      return;
    }

    if (!this.paymentEmail || !this.paymentEmail.includes('@')) {
      this.paymentError = 'Veuillez saisir un email valide.';

      return;
    }

    const method = this.paymentMethods.find(
      (paymentMethod) => paymentMethod.id === this.selectedPaymentMethod,
    );

    if (!method) {
      return;
    }

    const newPayment: Paiement = {
      id: Date.now(),

      date: new Date().toISOString().slice(0, 10),

      montant: this.montantAbonnement,

      methode: method.label,

      status: this.selectedPaymentMethod === 'carte' ? 'Réussi' : 'En attente',
    };

    this.paiements = [newPayment, ...this.paiements];

    this.paymentDone = true;

    this.activeTab = 'paiements';
  }

  setPaymentFilter(filter: PaymentFilter): void {
    this.paymentFilter = filter;
  }

  get filteredPayments(): Paiement[] {
    if (this.paymentFilter === 'Tous') {
      return this.paiements;
    }

    return this.paiements.filter(
      (paiement) => paiement.status === this.paymentFilter,
    );
  }

  get totalSuccessfulPayments(): number {
    return this.paiements
      .filter((paiement) => paiement.status === 'Réussi')
      .reduce((total, paiement) => total + paiement.montant, 0);
  }

  getStatusIcon(status: PaymentStatus): string {
  switch (status) {
    case 'Réussi':
      return 'check-circle-2';

    case 'Échoué':
      return 'alert-circle';

    case 'En attente':
    default:
      return 'clock';
  }
}

  getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'Réussi':
        return 'status-success';

      case 'Échoué':
        return 'status-error';

      default:
        return 'status-pending';
    }
  }

  /* =====================================================
     DATE
  ===================================================== */

  formatDate(date: string): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
