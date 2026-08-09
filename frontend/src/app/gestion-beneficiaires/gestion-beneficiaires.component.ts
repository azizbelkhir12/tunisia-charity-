import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import {
  faHeart,
  faUserPlus,
  faLink,
  faUsers,
  faFileAlt,
  faSearch,
  faCheck,
  faPlus,
  faTimes,
  faTrash,
  faEye,
  faDownload,
  faBaby,
} from '@fortawesome/free-solid-svg-icons';

import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import { DonorsService } from '../services/donors/donors.service';

type TabKey = 'creer' | 'affecter' | 'liste' | 'documents';

interface EnfantForm {
  nom: string;
  age: string;
}

interface Enfant {
  nom: string;
  age: number;
}

interface Beneficiaire {
  id: string;
  _id?: string;

  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  gouvernorat: string;

  age: number;

  enfants: Enfant[];

  documents?: {
    personalPhoto?: string;
    housePhoto?: string;

    bulletin?: {
      data?: any;
      originalName?: string;
      mimeType?: string;
      size?: number;
    };
  } | null;

  [key: string]: any;
}

interface Donateur {
  id: string;
  _id?: string;

  nom: string;
  email: string;

  beneficiaires?: any[];
  beneficiaries?: any[];

  [key: string]: any;
}

interface Affectation {
  id: string;

  donateurId: string;
  beneficiaireId: string;

  date: string;
}

interface DocFile {
  id: string;

  nom: string;
  type: string;
  taille: string;
  url?: string;
  kind:
    | 'personalPhoto'
    | 'housePhoto'
    | 'bulletin';
}

interface Depot {
  id: string;

  beneficiaireId: string;

  date: string;

  fichiers: DocFile[];
}

@Component({
  selector: 'app-gestion-beneficiaires',
  templateUrl: './gestion-beneficiaires.component.html',
  standalone: false,
  styleUrls: ['./gestion-beneficiaires.component.css'],
})
export class GestionBeneficiairesComponent implements OnInit {
  faHeart = faHeart;
  faUserPlus = faUserPlus;
  faLink = faLink;
  faUsers = faUsers;
  faFileAlt = faFileAlt;
  faSearch = faSearch;
  faCheck = faCheck;
  faPlus = faPlus;
  faTimes = faTimes;
  faTrash = faTrash;
  faEye = faEye;
  faDownload = faDownload;
  faBaby = faBaby;

  activeTab: TabKey = 'creer';

  loadingBeneficiaires = false;
  loadingDonateurs = false;

  creatingBeneficiaire = false;
  assigningBeneficiaire = false;

  loadError = '';

  gouvernorats: string[] = [
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
    'La Manouba',
    'Le Kef',
    'Mahdia',
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

  beneficiaires: Beneficiaire[] = [];

  donateurs: Donateur[] = [];

  affectations: Affectation[] = [];

  depots: Depot[] = [];

  form = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    adresse: '',
    gouvernorat: '',
    age: '',
  };

  enfants: EnfantForm[] = [];

  errors: Record<string, string> = {};

  saved = false;

  createError = '';

  selectedDonateurId = '';
  selectedBeneficiaireId = '';

  donateurSearch = '';
  beneficiaireAffectationSearch = '';

  affectationError = '';
  affectationSuccess = false;

  searchQuery = '';
  gouvernoratFilter = 'all';

  documentBeneficiaireFilter = 'all';
  documentSearch = '';

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private beneficiaireService: BeneficiaryService,
    private donorsService: DonorsService,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Gestion bénéficiaires — Admin Tunisia Charity');

    this.metaService.updateTag({
      name: 'robots',
      content: 'noindex',
    });

    this.loadBeneficiaires();
    this.loadDonateurs();
  }

  changeTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  loadBeneficiaires(): void {
    this.loadingBeneficiaires = true;
    this.loadError = '';

    this.beneficiaireService.getBeneficiaires().subscribe({
      next: (response: any) => {
        console.log('Bénéficiaires chargés:', response);

        const data = response?.data?.beneficiaries;

        if (Array.isArray(data)) {
          this.beneficiaires = data.map((beneficiaire: any) =>
            this.normalizeBeneficiaire(beneficiaire),
          );
        } else {
          this.beneficiaires = [];
        }

        console.log(
          'Liste bénéficiaires utilisée par le composant:',
          this.beneficiaires,
        );

        this.buildDepots();

        this.loadingBeneficiaires = false;
      },

      error: (error: any) => {
        console.error('Erreur chargement bénéficiaires:', error);

        this.beneficiaires = [];

        this.loadError = 'Impossible de charger les bénéficiaires.';

        this.loadingBeneficiaires = false;
      },
    });
  }

  loadDonateurs(): void {
    this.loadingDonateurs = true;

    this.donorsService.getDonors().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.donateurs = data.map((donateur: any) =>
          this.normalizeDonateur(donateur),
        );

        this.buildAffectations();

        this.loadingDonateurs = false;
      },

      error: (error: any) => {
        console.error('Erreur chargement donateurs:', error);

        this.loadingDonateurs = false;
      },
    });
  }

  private extractArray(response: any): any[] {
    // Beneficiaries API
    if (Array.isArray(response?.data?.beneficiaries)) {
      return response.data.beneficiaries;
    }

    // Direct array
    if (Array.isArray(response)) {
      return response;
    }

    // Generic nested data
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    // Other common formats
    if (Array.isArray(response?.beneficiaries)) {
      return response.beneficiaries;
    }

    if (Array.isArray(response?.beneficiaires)) {
      return response.beneficiaires;
    }

    if (Array.isArray(response?.donors)) {
      return response.donors;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    return [];
  }

  private normalizeBeneficiaire(beneficiaire: any): Beneficiaire {
    return {
      ...beneficiaire,

      id: beneficiaire?._id ?? beneficiaire?.id ?? '',

      _id: beneficiaire?._id,

      nom: beneficiaire?.name ?? '',

      prenom: beneficiaire?.lastname ?? '',

      email: beneficiaire?.email ?? '',

      telephone: beneficiaire?.phoneNumber ?? '',

      adresse: beneficiaire?.address ?? '',

      gouvernorat: beneficiaire?.gouvernorat ?? '',

      age: Number(beneficiaire?.Age ?? 0),

      enfants: Array.isArray(beneficiaire?.children)
        ? beneficiaire.children.map((child: any) => ({
            nom: child?.name ?? '',
            age: Number(child?.age ?? 0),
          }))
        : [],

      // IMPORTANT:
      // documents is an OBJECT, not an array
      documents: beneficiaire?.documents ?? null,
    };
  }

  private normalizeDonateur(donateur: any): Donateur {
    const nomComplet =
      donateur?.nom ??
      donateur?.fullName ??
      [donateur?.name, donateur?.Prenom].filter(Boolean).join(' ');

    return {
      ...donateur,

      id: donateur?._id ?? donateur?.id ?? '',

      _id: donateur?._id,

      nom: nomComplet || 'Donateur',

      email: donateur?.email ?? '',
    };
  }

  // =========================================================
  // KPI
  // =========================================================

  get totalBeneficiaires(): number {
    return this.beneficiaires.length;
  }

  get totalEnfants(): number {
    return this.beneficiaires.reduce(
      (total, beneficiaire) => total + (beneficiaire.enfants?.length ?? 0),
      0,
    );
  }

  get totalBeneficiairesAffectes(): number {
    return new Set(
      this.affectations.map((affectation) => affectation.beneficiaireId),
    ).size;
  }

  get totalDocuments(): number {
    return this.depots.reduce(
      (total, depot) => total + depot.fichiers.length,
      0,
    );
  }

  // =========================================================
  // CHILDREN
  // =========================================================

  addEnfant(): void {
    this.enfants.push({
      nom: '',
      age: '',
    });

    this.saved = false;
  }

  removeEnfant(index: number): void {
    this.enfants.splice(index, 1);

    this.saved = false;

    this.errors = {};
  }

  // =========================================================
  // CREATE BENEFICIARY
  // =========================================================

  submitCreate(): void {
    this.saved = false;
    this.createError = '';

    const newErrors: Record<string, string> = {};

    if (!this.form.nom.trim()) {
      newErrors['nom'] = 'Le nom est requis';
    }

    if (!this.form.prenom.trim()) {
      newErrors['prenom'] = 'Le prénom est requis';
    }

    if (!/^\S+@\S+\.\S+$/.test(this.form.email)) {
      newErrors['email'] = 'Adresse e-mail invalide';
    }

    if (!/^[0-9\s+]{8,}$/.test(this.form.telephone)) {
      newErrors['telephone'] = 'Numéro de téléphone invalide';
    }

    if (this.form.motDePasse.length < 8) {
      newErrors['motDePasse'] = '8 caractères minimum';
    }

    if (!this.form.adresse.trim()) {
      newErrors['adresse'] = "L'adresse est requise";
    }

    if (!this.form.gouvernorat) {
      newErrors['gouvernorat'] = 'Choisissez un gouvernorat';
    }

    if (!this.form.age || Number(this.form.age) < 18) {
      newErrors['age'] = 'Âge invalide (18 ans minimum)';
    }

    this.enfants.forEach((enfant, index) => {
      if (!enfant.nom.trim()) {
        newErrors[`enfant-nom-${index}`] = 'Nom requis';
      }

      if (enfant.age === '' || Number(enfant.age) < 0) {
        newErrors[`enfant-age-${index}`] = 'Âge requis';
      }
    });

    this.errors = newErrors;

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const beneficiaireData = {
      nom: this.form.nom.trim(),

      prenom: this.form.prenom.trim(),

      email: this.form.email.trim(),

      telephone: this.form.telephone.trim(),

      motDePasse: this.form.motDePasse,

      adresse: this.form.adresse.trim(),

      gouvernorat: this.form.gouvernorat,

      age: Number(this.form.age),

      enfants: this.enfants.map((enfant) => ({
        nom: enfant.nom.trim(),

        age: Number(enfant.age),
      })),
    };

    this.creatingBeneficiaire = true;

    this.beneficiaireService.createBeneficiaire(beneficiaireData).subscribe({
      next: (response: any) => {
        console.log('Bénéficiaire créé:', response);

        this.creatingBeneficiaire = false;

        this.saved = true;

        this.resetCreateForm();

        // Reload from backend so UI
        // always reflects MongoDB data.
        this.loadBeneficiaires();
      },

      error: (error: any) => {
        console.error('Erreur création bénéficiaire:', error);

        this.creatingBeneficiaire = false;

        this.createError =
          error?.error?.message ??
          error?.error?.error ??
          'Impossible de créer le bénéficiaire.';
      },
    });
  }

  resetCreateForm(): void {
    this.form = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      motDePasse: '',
      adresse: '',
      gouvernorat: '',
      age: '',
    };

    this.enfants = [];

    this.errors = {};
  }

  // =========================================================
  // DELETE BENEFICIARY
  // =========================================================

  supprimerBeneficiaire(id: string): void {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      'Voulez-vous vraiment supprimer ce bénéficiaire ?',
    );

    if (!confirmed) {
      return;
    }

    this.beneficiaireService.deleteBeneficiaire(id).subscribe({
      next: () => {
        this.beneficiaires = this.beneficiaires.filter(
          (beneficiaire) => beneficiaire.id !== id,
        );

        this.affectations = this.affectations.filter(
          (affectation) => affectation.beneficiaireId !== id,
        );

        this.depots = this.depots.filter(
          (depot) => depot.beneficiaireId !== id,
        );
      },

      error: (error: any) => {
        console.error('Erreur suppression bénéficiaire:', error);

        alert(
          error?.error?.message ?? 'Impossible de supprimer le bénéficiaire.',
        );
      },
    });
  }

  // =========================================================
  // DONOR SEARCH
  // =========================================================

  get donateursFiltres(): Donateur[] {
    const search = this.donateurSearch.trim().toLowerCase();

    if (!search) {
      return this.donateurs;
    }

    return this.donateurs.filter((donateur) => {
      return `${donateur.nom} ${donateur.email}`.toLowerCase().includes(search);
    });
  }

  // =========================================================
  // BENEFICIARY SEARCH FOR ASSIGNMENT
  // =========================================================

  get beneficiairesAffectationFiltres(): Beneficiaire[] {
    const search = this.beneficiaireAffectationSearch.trim().toLowerCase();

    if (!search) {
      return this.beneficiaires;
    }

    return this.beneficiaires.filter((beneficiaire) => {
      const text = [
        beneficiaire.prenom,
        beneficiaire.nom,
        beneficiaire.email,
        beneficiaire.gouvernorat,
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(search);
    });
  }

  // =========================================================
  // ASSIGN BENEFICIARY
  // =========================================================

  submitAffectation(): void {
    this.affectationSuccess = false;

    this.affectationError = '';

    if (!this.selectedDonateurId || !this.selectedBeneficiaireId) {
      this.affectationError = 'Choisissez un donateur et un bénéficiaire';

      return;
    }

    const exists = this.affectations.some(
      (affectation) =>
        affectation.donateurId === this.selectedDonateurId &&
        affectation.beneficiaireId === this.selectedBeneficiaireId,
    );

    if (exists) {
      this.affectationError = 'Cette affectation existe déjà';

      return;
    }

    this.assigningBeneficiaire = true;

    this.donorsService
      .assignBeneficiaryToDonor(
        this.selectedDonateurId,
        this.selectedBeneficiaireId,
      )
      .subscribe({
        next: () => {
          this.assigningBeneficiaire = false;

          this.affectationSuccess = true;

          const affectation: Affectation = {
            id: `${Date.now()}`,

            donateurId: this.selectedDonateurId,

            beneficiaireId: this.selectedBeneficiaireId,

            date: this.today(),
          };

          this.affectations = [affectation, ...this.affectations];

          this.selectedBeneficiaireId = '';

          // Reload donors because the backend
          // relation has changed.
          this.loadDonateurs();
        },

        error: (error: any) => {
          console.error('Erreur affectation:', error);

          this.assigningBeneficiaire = false;

          this.affectationSuccess = false;

          this.affectationError =
            error?.error?.message ??
            error?.error?.error ??
            'Impossible d’affecter le bénéficiaire.';
        },
      });
  }

  // =========================================================
  // BUILD EXISTING ASSIGNMENTS FROM DONORS
  // =========================================================

  private buildAffectations(): void {
    const result: Affectation[] = [];

    this.donateurs.forEach((donateur) => {
      const relations =
        donateur.beneficiaires ??
        donateur.beneficiaries ??
        donateur['assignedBeneficiaries'] ??
        [];

      if (!Array.isArray(relations)) {
        return;
      }

      relations.forEach((relation: any, index: number) => {
        const beneficiaryId =
          typeof relation === 'string'
            ? relation
            : (relation?._id ??
              relation?.id ??
              relation?.beneficiaryId ??
              relation?.beneficiaireId);

        if (!beneficiaryId) {
          return;
        }

        result.push({
          id: relation?._id ?? `${donateur.id}-${beneficiaryId}-${index}`,

          donateurId: donateur.id,

          beneficiaireId: beneficiaryId,

          date:
            relation?.date ?? relation?.assignedAt ?? relation?.createdAt ?? '',
        });
      });
    });

    this.affectations = result;
  }

  // =========================================================
  // REMOVE ASSIGNMENT LOCALLY
  // =========================================================

  supprimerAffectation(id: string): void {
    /*
      IMPORTANT:

      Your DonorsService currently has no
      "remove assignment" endpoint.

      Therefore we cannot safely delete the
      assignment from MongoDB here.

      This only removes it visually.

      Once you have an API such as:

      DELETE /unassign-beneficiary/:donorId/:beneficiaryId

      replace this method with the real HTTP call.
    */

    this.affectations = this.affectations.filter(
      (affectation) => affectation.id !== id,
    );
  }

  // =========================================================
  // NAMES
  // =========================================================

  getDonateurName(id: string): string {
    return this.donateurs.find((donateur) => donateur.id === id)?.nom ?? '—';
  }

  getBeneficiaireName(id: string): string {
    const beneficiaire = this.beneficiaires.find((item) => item.id === id);

    if (!beneficiaire) {
      return '—';
    }

    return `${beneficiaire.prenom} ` + `${beneficiaire.nom}`;
  }

  // =========================================================
  // BENEFICIARY FILTER
  // =========================================================

  get filteredBeneficiaires(): Beneficiaire[] {
    const search = this.searchQuery.trim().toLowerCase();

    return this.beneficiaires.filter((beneficiaire) => {
      if (
        this.gouvernoratFilter !== 'all' &&
        beneficiaire.gouvernorat !== this.gouvernoratFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const text = [
        beneficiaire.nom,
        beneficiaire.prenom,
        beneficiaire.email,
        beneficiaire.telephone,
        beneficiaire.gouvernorat,
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(search);
    });
  }

  
 private buildDepots(): void {
  const result: Depot[] = [];

  this.beneficiaires.forEach(
    beneficiaire => {

      const documents =
        beneficiaire.documents;

      if (!documents) {
        return;
      }

      const fichiers: DocFile[] = [];

      // =====================================================
      // PERSONAL PHOTO
      // =====================================================

      if (documents.personalPhoto) {
        const fileName =
          this.getFileNameFromPath(
            documents.personalPhoto
          );

        fichiers.push({
          id:
            `${beneficiaire.id}-personal-photo`,

          nom:
            fileName ||
            'Photo personnelle',

          type:
            this.getFileExtension(
              fileName ||
              documents.personalPhoto
            ),

          taille:
            '—',

          url:
            documents.personalPhoto,

          kind:
            'personalPhoto'
        });
      }

      // =====================================================
      // HOUSE PHOTO
      // =====================================================

      if (documents.housePhoto) {
        const fileName =
          this.getFileNameFromPath(
            documents.housePhoto
          );

        fichiers.push({
          id:
            `${beneficiaire.id}-house-photo`,

          nom:
            fileName ||
            'Photo du domicile',

          type:
            this.getFileExtension(
              fileName ||
              documents.housePhoto
            ),

          taille:
            '—',

          url:
            documents.housePhoto,

          kind:
            'housePhoto'
        });
      }

      const bulletin =
        documents.bulletin;

      if (
        bulletin &&
        (
          bulletin.originalName ||
          bulletin.data
        )
      ) {
        fichiers.push({
          id:
            `${beneficiaire.id}-bulletin`,

          nom:
            bulletin.originalName ||
            'bulletin.pdf',

          type:
            this.normalizeDocumentType(
              bulletin.mimeType || '',
              bulletin.originalName ||
                'bulletin.pdf'
            ),

          taille:
            this.formatDocumentSize(
              bulletin.size
            ),

          kind:
            'bulletin'
        });
      }

      // No submitted documents
      if (fichiers.length === 0) {
        return;
      }

      result.push({
        id:
          beneficiaire.id,

        beneficiaireId:
          beneficiaire.id,

        date:
          beneficiaire['updatedAt'] ??
          beneficiaire['createdAt'] ??
          '',

        fichiers
      });
    }
  );

  this.depots = result;

  console.log('Dépôts construits:',this.depots);
}

private getFileNameFromPath(
  path: string
): string {

  if (!path) {
    return '';
  }

  return (
    path
      .split('/')
      .pop()
      ?.split('\\')
      .pop() ??
    ''
  );
}


  get filteredDepots(): Depot[] {
    const search = this.documentSearch.trim().toLowerCase();

    return this.depots.filter((depot) => {
      if (
        this.documentBeneficiaireFilter !== 'all' &&
        depot.beneficiaireId !== this.documentBeneficiaireFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const beneficiaire = this.beneficiaires.find(
        (item) => item.id === depot.beneficiaireId,
      );

      const content = [
        beneficiaire ? `${beneficiaire.prenom} ${beneficiaire.nom}` : '',

        depot.date,

        ...depot.fichiers.map((fichier) => fichier.nom),
      ]
        .join(' ')
        .toLowerCase();

      return content.includes(search);
    });
  }

  // =========================================================
  // UPLOAD DOCUMENTS
  // =========================================================

  uploadDocuments(beneficiaireId: string, event: Event): void {
    const input = event.target as HTMLInputElement;

    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      /*
          If your backend multer expects another
          field name, change ONLY "documents".
        */

      formData.append('documents', file);
    });

    this.beneficiaireService
      .uploadDocuments(beneficiaireId, formData)
      .subscribe({
        next: () => {
          input.value = '';

          this.loadBeneficiaires();
        },

        error: (error: any) => {
          console.error('Erreur upload documents:', error);

          alert(error?.error?.message ?? 'Impossible d’envoyer les documents.');
        },
      });
  }

  // =========================================================
  // DOWNLOAD BULLETIN
  // =========================================================

  downloadBulletin(beneficiaireId: string): void {
    this.beneficiaireService.downloadBulletin(beneficiaireId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        const anchor = document.createElement('a');

        anchor.href = url;

        anchor.download = `bulletin-${beneficiaireId}.pdf`;

        anchor.click();

        window.URL.revokeObjectURL(url);
      },

      error: (error: any) => {
        console.error('Erreur téléchargement bulletin:', error);

        alert('Impossible de télécharger le bulletin.');
      },
    });
  }

  // =========================================================
  // DOCUMENT HELPERS
  // =========================================================

  private getFileExtension(filename: string): string {
    return filename?.split('.').pop()?.toLowerCase() ?? 'file';
  }

  private normalizeDocumentType(type: string, filename: string): string {
    if (!type) {
      return this.getFileExtension(filename);
    }

    if (type.includes('/')) {
      const subtype = type.split('/').pop();

      return subtype ?? 'file';
    }

    return type;
  }

  private formatDocumentSize(size: any): string {
    if (size === null || size === undefined || size === '') {
      return '—';
    }

    if (typeof size === 'string') {
      return size;
    }

    const numericSize = Number(size);

    if (Number.isNaN(numericSize)) {
      return '—';
    }

    if (numericSize < 1024) {
      return `${numericSize} o`;
    }

    if (numericSize < 1024 * 1024) {
      return `${(numericSize / 1024).toFixed(1)} Ko`;
    }

    return `${(numericSize / (1024 * 1024)).toFixed(1)} Mo`;
  }

  // =========================================================
  // UTILS
  // =========================================================

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
