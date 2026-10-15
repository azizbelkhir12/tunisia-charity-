import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import { NotificationService } from '../services/notification/notification.service';
import { Router } from '@angular/router';


type TabId = 'infos' | 'notifications' | 'documents';

interface NavigationItem {
  id: TabId;
  label: string;
  icon: string;
}

interface BeneficiaryProfile {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  gouvernorat: string;
  age: number;
  adresse: string;
  photo: string;
}

interface BeneficiaryNotification {
  id: string;
  titre: string;
  contenu: string;
  date: string;
  type: string;
}

interface DepotFile {
  nom: string;
  taille: number;
}

interface Depot {
  id: string;
  date: string;
  note: string;
  status: 'En attente' | 'Validé';
  fichiers: DepotFile[];
}
@Component({
  selector: 'app-beneficiaire-compte',
  templateUrl: './beneficiaire-compte.component.html',
  styleUrls: ['./beneficiaire-compte.component.css'],
  standalone: false,
})
export class BeneficiaireCompteComponent implements OnInit {
  @ViewChild('photoInput')
  photoInput?: ElementRef<HTMLInputElement>;

  @ViewChild('documentsInput')
  documentsInput?: ElementRef<HTMLInputElement>;

  beneficiaireId = '';

  loading = false;
  savingProfile = false;
  uploadingPhoto = false;
  uploadingDocuments = false;

  generalError = '';

  activeTab: TabId = 'infos';

  readonly navigationItems: NavigationItem[] = [
    {
      id: 'infos',
      label: 'Mes informations',
      icon: 'user',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'bell',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'folder-up',
    },
  ];

  setActiveTab(tab: TabId): void {
    this.activeTab = tab;
  }

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

  profile: BeneficiaryProfile = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    gouvernorat: '',
    age: 0,
    adresse: '',
    photo: '',
  };

  draftProfile: BeneficiaryProfile = {
    ...this.profile,
  };

  editingProfile = false;
  profileSaved = false;
  profileError = '';

  notifications: BeneficiaryNotification[] = [];

  readNotificationIds: string[] = [];

  notificationSearch = '';

  depots: Depot[] = [];

  selectedFiles: File[] = [];

  documentNote = '';

  documentError = '';

  documentsSent = false;

  isDragging = false;

  constructor(
    private beneficiaryService: BeneficiaryService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.getBeneficiaireId();

    if (this.beneficiaireId) {
      this.loadBeneficiaire();
    } else {
      this.generalError =
        'Impossible de trouver l’identifiant du bénéficiaire.';
    }
  }

  // =========================================================
  // GET BENEFICIAIRE ID
  // =========================================================

  private getBeneficiaireId(): void {
    /*
     * Adapte cette partie à la manière dont tu stockes
     * l'utilisateur connecté.
     */

    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
      return;
    }

    try {
      const user = JSON.parse(currentUser);

      this.beneficiaireId = user._id || user.id || user.beneficiaireId || '';
    } catch (error) {
      console.error('Erreur lors de la lecture de currentUser :', error);
    }
  }

  loadBeneficiaire(): void {
    this.loading = true;
    this.generalError = '';

    this.beneficiaryService.getBeneficiaireById(this.beneficiaireId).subscribe({
      next: (response: any) => {
        const beneficiaire = response?.data?.beneficiary;

        if (!beneficiaire) {
          this.generalError =
            'Les informations du bénéficiaire sont introuvables.';

          this.loading = false;

          return;
        }

        // Mapper MongoDB → Angular
        this.mapBeneficiaireToProfile(beneficiaire);

        this.loading = false;
      },

      error: (error) => {
        console.error('Erreur récupération bénéficiaire :', error);

        this.generalError = 'Impossible de récupérer vos informations.';

        this.loading = false;
      },
    });
  }

  private loadNotifications(): void {
    if (!this.beneficiaireId) {
      console.error(
        'Impossible de charger les notifications : ID bénéficiaire absent.',
      );

      this.notifications = [];

      return;
    }

    

    this.notificationService
      .getNotificationById(this.beneficiaireId)
      .subscribe({
        next: (response: any) => {
          const notifications =
            response?.data?.notifications ||
            response?.notifications ||
            response?.data ||
            [];

          if (!Array.isArray(notifications)) {
            console.warn(
              'Les notifications reçues ne sont pas un tableau :',
              notifications,
            );

            this.notifications = [];

            return;
          }

          this.notifications = notifications
            .map((notification: any) => {
              const id = notification?._id || notification?.id;

              if (!id) {
                return null;
              }

              return {
                id: id.toString(),

                titre: notification?.titre || 'Notification',

                contenu: notification?.contenu || '',

                date:
                  notification?.createdAt ||
                  notification?.date ||
                  new Date().toISOString(),

                type: notification?.type || 'Information',
              } as BeneficiaryNotification;
            })
            .filter(
              (
                notification: BeneficiaryNotification | null,
              ): notification is BeneficiaryNotification =>
                notification !== null,
            );

          this.notifications.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        },

        error: (error) => {
          console.error('Erreur récupération notifications :', error);

          this.notifications = [];
        },
      });
  }

  private mapBeneficiaireToProfile(beneficiaire: any): void {
    if (!beneficiaire) {
      return;
    }

    this.profile = {
      nom: beneficiaire.lastname || '',

      prenom: beneficiaire.name || '',

      email: beneficiaire.email || '',

      telephone: beneficiaire.phoneNumber || '',

      gouvernorat: beneficiaire.gouvernorat || '',

      age: beneficiaire.Age || 0,

      adresse: beneficiaire.address || '',

      photo: this.getPhotoUrl(beneficiaire.photoUrl),
    };

    this.draftProfile = {
      ...this.profile,
    };

    this.readNotificationIds = (beneficiaire.readNotifications || [])
      .map((notification: any) => {
        if (typeof notification === 'object') {
          return notification._id?.toString();
        }

        return notification?.toString();
      })
      .filter(Boolean);

    this.loadNotifications();

    this.mapDocuments(beneficiaire.documents);
  }

  private getPhotoUrl(photoUrl: string | undefined): string {
    if (!photoUrl) {
      return '';
    }

    if (
      photoUrl.startsWith('http://') ||
      photoUrl.startsWith('https://') ||
      photoUrl.startsWith('blob:')
    ) {
      return photoUrl;
    }

    return `http://localhost:3000${photoUrl}`;
  }

  get profileInitials(): string {
    return (
      (this.profile.prenom?.charAt(0) || '') +
      (this.profile.nom?.charAt(0) || '')
    ).toUpperCase();
  }

  get draftInitials(): string {
    return (
      (this.draftProfile.prenom?.charAt(0) || '') +
      (this.draftProfile.nom?.charAt(0) || '')
    ).toUpperCase();
  }

  get profileRows(): {
    label: string;
    value: string;
  }[] {
    return [
      {
        label: 'Nom',
        value: this.profile.nom,
      },

      {
        label: 'Prénom',
        value: this.profile.prenom,
      },

      {
        label: 'Email',
        value: this.profile.email,
      },

      {
        label: 'Téléphone',
        value: this.profile.telephone,
      },

      {
        label: 'Gouvernorat',
        value: this.profile.gouvernorat,
      },

      {
        label: 'Âge',
        value: `${this.profile.age} ans`,
      },

      {
        label: 'Adresse',
        value: this.profile.adresse,
      },
    ];
  }

  startProfileEdit(): void {
    this.draftProfile = {
      ...this.profile,
    };

    this.profileError = '';
    this.profileSaved = false;
    this.editingProfile = true;
  }

  cancelProfileEdit(): void {
    this.draftProfile = {
      ...this.profile,
    };

    this.profileError = '';
    this.editingProfile = false;
  }

  saveProfile(): void {
    if (
      !this.draftProfile.nom?.trim() ||
      !this.draftProfile.prenom?.trim() ||
      !this.draftProfile.email?.includes('@') ||
      !this.draftProfile.telephone?.trim()
    ) {
      this.profileError =
        'Veuillez renseigner un nom, un prénom, un email valide et un téléphone.';

      return;
    }

    if (
      !this.draftProfile.age ||
      this.draftProfile.age < 16 ||
      this.draftProfile.age > 120
    ) {
      this.profileError = 'Veuillez saisir un âge valide (16-120).';

      return;
    }

    if (!this.draftProfile.adresse?.trim()) {
      this.profileError = 'Veuillez renseigner votre adresse.';

      return;
    }

    this.savingProfile = true;
    this.profileError = '';


    const beneficiaireData = {
      name: this.draftProfile.prenom,

      lastname: this.draftProfile.nom,

      email: this.draftProfile.email,

      phoneNumber: this.draftProfile.telephone,

      gouvernorat: this.draftProfile.gouvernorat,

      Age: this.draftProfile.age,

      address: this.draftProfile.adresse,
    };

    this.beneficiaryService
      .updateBeneficiaire(this.beneficiaireId, beneficiaireData)
      .subscribe({
        next: (response: any) => {
          this.profile = {
            ...this.draftProfile,
          };

          this.editingProfile = false;
          this.profileSaved = true;
          this.savingProfile = false;

          /*
           * On recharge depuis MongoDB
           * pour être certain d'avoir les données
           * réellement enregistrées.
           */

          this.loadBeneficiaire();
        },

        error: (error) => {
          console.error('Erreur modification bénéficiaire :', error);

          this.profileError =
            error?.error?.message ||
            'Une erreur est survenue lors de la modification.';

          this.savingProfile = false;
        },
      });
  }

  // =========================================================
  // PHOTO
  // =========================================================

  openPhotoPicker(): void {
    this.photoInput?.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.profileError = 'La photo doit être au format JPG ou PNG.';

      input.value = '';

      return;
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      this.profileError = 'La photo ne doit pas dépasser 2 Mo.';

      input.value = '';

      return;
    }

    this.profileError = '';

    const imageUrl = URL.createObjectURL(file);

    this.draftProfile = {
      ...this.draftProfile,

      photo: imageUrl,
    };

    this.uploadPhoto(file);

    input.value = '';
  }

  private uploadPhoto(file: File): void {
    this.uploadingPhoto = true;

    this.beneficiaryService.uploadPhoto(this.beneficiaireId, file).subscribe({
      next: (response: any) => {
        const photoUrl =
          response?.photoUrl ||
          response?.beneficiaire?.photoUrl ||
          response?.data?.photoUrl;

        if (photoUrl) {
          const finalPhotoUrl = this.getPhotoUrl(photoUrl);

          this.profile.photo = finalPhotoUrl;

          this.draftProfile.photo = finalPhotoUrl;
        }

        this.uploadingPhoto = false;
      },

      error: (error) => {
        console.error('Erreur upload photo :', error);

        this.profileError = 'Impossible de télécharger la photo.';

        this.uploadingPhoto = false;

        /*
         * Retour à l'ancienne photo
         */

        this.draftProfile.photo = this.profile.photo;
      },
    });
  }

  removeProfilePhoto(): void {
    this.draftProfile = {
      ...this.draftProfile,

      photo: '',
    };
  }

  get unreadCount(): number {
    return this.notifications.filter(
      (notification) => !this.isNotificationRead(notification.id),
    ).length;
  }

  get filteredNotifications(): BeneficiaryNotification[] {
    const query = this.notificationSearch.trim().toLowerCase();

    if (!query) {
      return this.notifications;
    }

    return this.notifications.filter(
      (notification) =>
        notification.titre.toLowerCase().includes(query) ||
        notification.contenu.toLowerCase().includes(query),
    );
  }

  isNotificationRead(id: string): boolean {
    return this.readNotificationIds.some(
      (readId) => readId.toString() === id.toString(),
    );
  }

  markNotificationAsRead(id: string): void {
    if (this.isNotificationRead(id)) {
      return;
    }

    this.readNotificationIds = [...this.readNotificationIds, id];
  }

  markAllNotificationsAsRead(): void {
    if (!this.beneficiaireId) {
      console.error(
        'Impossible de marquer les notifications comme lues : ID bénéficiaire absent.',
      );

      return;
    }

    if (this.notifications.length === 0) {

      return;
    }

    this.notificationService
      .markAllNotificationsAsRead(this.beneficiaireId)
      .subscribe({
        next: (response: any) => {


          this.readNotificationIds = this.notifications.map((notification) =>
            notification.id.toString(),
          );

        },

        error: (error) => {
          console.error(
            'Erreur lors du marquage des notifications comme lues :',
            error,
          );
        },
      });
  }

  // =========================================================
  // DOCUMENTS
  // =========================================================

  private mapDocuments(documents: any[]): void {
    if (!Array.isArray(documents)) {
      this.depots = [];

      return;
    }

    this.depots = documents.map((document: any, index: number) => ({
      id: document._id || String(index),

      date: document.createdAt || new Date().toISOString(),

      note: document.description || 'Document envoyé',

      status: 'En attente',

      fichiers: [
        {
          nom: document.originalName || 'Document',

          taille: document.size || 0,
        },
      ],
    }));
  }

  openDocumentsPicker(): void {
    this.documentsInput?.nativeElement.click();
  }

  onDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.addFiles(input.files);

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();

    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  private addFiles(fileList: FileList | null): void {
    if (!fileList) {
      return;
    }

    const files = Array.from(fileList);

    const validFiles = files.filter((file) => this.isAcceptedDocument(file));

    if (validFiles.length !== files.length) {
      this.documentError =
        'Seuls les fichiers PDF, JPG, JPEG et PNG sont acceptés.';
    } else {
      this.documentError = '';
    }

    this.selectedFiles = [...this.selectedFiles, ...validFiles];

    this.documentsSent = false;
  }

  private isAcceptedDocument(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase();

    return ['pdf', 'jpg', 'jpeg', 'png'].includes(extension || '');
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter(
      (_, currentIndex) => currentIndex !== index,
    );
  }

  submitDocuments(): void {
    if (this.selectedFiles.length === 0) {
      this.documentError =
        'Veuillez sélectionner au moins un fichier (PDF, JPG, JPEG ou PNG).';

      return;
    }

    this.uploadingDocuments = true;
    this.documentError = '';

    const formData = new FormData();

    this.selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });

    formData.append(
      'description',
      this.documentNote.trim() || 'Sans description',
    );

    this.beneficiaryService
      .uploadDocuments(this.beneficiaireId, formData)
      .subscribe({
        next: (response: any) => {
          this.selectedFiles = [];

          this.documentNote = '';

          this.documentError = '';

          this.documentsSent = true;

          this.uploadingDocuments = false;

          this.loadBeneficiaire();
        },

        error: (error) => {
          console.error('Erreur upload documents :', error);

          this.documentError =
            error?.error?.message ||
            'Une erreur est survenue lors de l’envoi des documents.';

          this.uploadingDocuments = false;
        },
      });
  }

  downloadBulletin(): void {
    this.beneficiaryService.downloadBulletin(this.beneficiaireId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;

        link.download = 'bulletin.pdf';

        link.click();

        window.URL.revokeObjectURL(url);
      },

      error: (error) => {
        console.error('Erreur téléchargement bulletin :', error);
      },
    });
  }

  // =========================================================
  // UTILS
  // =========================================================

  humanSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} o`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} Ko`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  logout(): void {

  // Delete authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');

  // If you have other authentication keys, remove them too
  localStorage.removeItem('user');
  localStorage.removeItem('beneficiaire');

  // Redirect to login
  this.router.navigate(['/login']);
}
}
