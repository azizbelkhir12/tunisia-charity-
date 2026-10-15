import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { DonorsService } from '../services/donors/donors.service';
import { RapportService } from '../services/rapport/rapport.service';

type DonorType = 'standard' | 'parrain';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface Donor {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  address: string;
  zipCode: string;
  phone: string;
  status: DonorType;
  img?: string;
  assignedBeneficiaries?: any[];
}

@Component({
  selector: 'app-donateur-compte',
  standalone: false,
  templateUrl: './donateur-compte.component.html',
  styleUrl: './donateur-compte.component.css',
})
export class DonateurCompteComponent implements OnInit {
  donorId: string | null = null;

  donor: Donor | null = null;

  infos: Donor = {
    name: '',
    email: '',
    address: '',
    zipCode: '',
    phone: '',
    status: 'standard',
    img: '',
    assignedBeneficiaries: [],
  };

  draft: Donor = { ...this.infos };

  isParrain = false;

  tab = 'infos';

  navigationItems: NavItem[] = [];

  loading = true;
  loadError = '';

  editing = false;
  saved = false;
  profileError = '';

  // =========================
  // DONATION
  // =========================

  montant = '';
  methode = 'En ligne';
  nom = '';
  email = '';
  projet = '';

  donationDone = false;
  donationError = '';

  readonly PROJETS: string[] = [
    'Éducation pour tous',
    "Accès à l'eau potable",
    'Santé & soins',
    'Aide alimentaire',
    'Reboisement',
    "Abris d'urgence",
  ];

  // =========================
  // DONATIONS / PAIEMENTS
  // =========================

  donations: any[] = [];
  paiementSearch = '';

  // =========================
  // RAPPORTS
  // =========================

  rapports: any[] = [];
  rapportSearch = '';

  // =========================
  // PARRAINAGE
  // =========================

  parrainages: any[] = [];

  constructor(
    private authService: AuthService,
    private donorService: DonorsService,
    private rapportService: RapportService,
  ) {}

  ngOnInit(): void {
    this.donorId = this.authService.getCurrentUserId();

    if (!this.donorId) {
      this.loading = false;
      this.loadError = 'Utilisateur connecté introuvable.';
      console.error('No current donor ID found.');
      return;
    }

    this.loadDonor();
    this.loadDonations();
    this.loadRapports();
  }

  loadDonor(): void {
    if (!this.donorId) {
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.donorService.getDonorsById(this.donorId).subscribe({
      next: (response: any) => {

        const donorData = Array.isArray(response)
          ? response[0]
          : response?.donor || response?.data || response;

        if (!donorData) {
          this.loading = false;
          this.loadError = 'Donateur introuvable.';
          return;
        }

        this.donor = donorData;

        this.infos = {
          _id: donorData._id,
          id: donorData.id,

          name: donorData.name || '',
          email: donorData.email || '',
          address: donorData.address || '',
          zipCode: donorData.zipCode || '',
          phone: donorData.phone || '',

          status: donorData.status === 'parrain' ? 'parrain' : 'standard',

          img: donorData.img || '',

          assignedBeneficiaries: donorData.assignedBeneficiaries || [],
        };

        this.draft = { ...this.infos };

        
        this.nom = this.infos.name;
        this.email = this.infos.email;
        this.projet = this.PROJETS[0];

        // IMPORTANT :
        // le profil est maintenant déterminé par MongoDB
        this.isParrain = this.infos.status === 'parrain';

        

        // Génère automatiquement la navigation
        this.buildNavigation();

        // Un parrain récupère aussi ses bénéficiaires
        if (this.isParrain) {
          this.loadBeneficiaries();
        }

        this.loading = false;
      },

      error: (error) => {
        console.error('Error loading donor:', error);

        this.loading = false;

        this.loadError = 'Impossible de charger les informations du donateur.';
      },
    });
  }

  // ============================================================
  // DYNAMIC NAVIGATION
  // ============================================================

  private buildNavigation(): void {
    this.navigationItems = [
      {
        id: 'infos',
        label: 'Mes informations',
        icon: 'user',
      },

      {
        id: 'don',
        label: 'Effectuer un don',
        icon: 'hand-coins',
      },

      {
        id: 'historique',
        label: 'Historique de paiement',
        icon: 'history',
      },
    ];

    // ================================
    // DYNAMIC BASED ON DATABASE STATUS
    // ================================

    if (this.isParrain) {
      this.navigationItems.push({
        id: 'parrainage',
        label: 'Parrainage enfant',
        icon: 'heart-handshake',
      });
    } else {
      this.navigationItems.push({
        id: 'rapports',
        label: 'Rapports',
        icon: 'file-text',
      });
    }

    const tabExists = this.navigationItems.some((item) => item.id === this.tab);

    if (!tabExists) {
      this.tab = 'infos';
    }
  }

  setTab(tab: string): void {
    this.tab = tab;
  }


  startEdit(): void {
    this.draft = {
      ...this.infos,
    };

    this.profileError = '';
    this.saved = false;
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;

    this.profileError = '';

    this.draft = {
      ...this.infos,
    };
  }

  saveProfile(): void {
    if (
      !this.draft.name?.trim() ||
      !this.draft.email?.trim() ||
      !this.draft.phone?.trim() ||
      !this.draft.address?.trim() ||
      !this.draft.zipCode?.trim()
    ) {
      this.profileError = 'Veuillez remplir tous les champs.';

      return;
    }

    if (!this.draft.email.includes('@')) {
      this.profileError = 'Veuillez saisir une adresse email valide.';

      return;
    }

    if (!this.donorId) {
      return;
    }

    const updatedDonor = {
      name: this.draft.name,

      email: this.draft.email,

      address: this.draft.address,

      zipCode: this.draft.zipCode,

      phone: this.draft.phone,

      img: this.draft.img || '',
    };

    this.donorService.updateDonor(this.donorId, updatedDonor).subscribe({
      next: (response: any) => {
        
        this.infos = {
          ...this.infos,
          ...updatedDonor,
        };

        this.draft = {
          ...this.infos,
        };

        this.nom = this.infos.name;
        this.email = this.infos.email;

        this.profileError = '';
        this.editing = false;
        this.saved = true;
      },

      error: (error) => {
        console.error('Error updating donor:', error);

        this.profileError =
          error?.error?.message || 'Impossible de modifier vos informations.';
      },
    });
  }

  loadDonations(): void {
    if (!this.donorId) {
      return;
    }

    this.donorService.getDonationsByDonorId(this.donorId).subscribe({
      next: (response) => {

        if (response && Array.isArray(response.donations)) {
          this.donations = response.donations;
        } else {
          this.donations = [];
        }
      },

      error: (error) => {
        console.error('Error loading donations:', error);

        this.donations = [];
      },
    });
  }

  get filteredPaiements(): any[] {
    const search = this.paiementSearch.trim().toLowerCase();

    if (!search) {
      return this.donations;
    }

    return this.donations.filter((donation) => {
      const value = `
          ${donation.date || donation.createdAt || ''}
          ${donation.montant || donation.amount || ''}
          ${donation.methode || donation.paymentMethod || ''}
          ${donation.status || ''}
        `.toLowerCase();

      return value.includes(search);
    });
  }

  get totalConfirme(): number {
    return this.donations
      .filter((donation) => {
        const status = String(donation.status || '').toLowerCase();

        return (
          status === 'confirmé' ||
          status === 'confirme' ||
          status === 'confirmed' ||
          status === 'success' ||
          status === 'paid'
        );
      })
      .reduce(
        (total, donation) =>
          total + Number(donation.montant ?? donation.amount ?? 0),
        0,
      );
  }

  get nombreConfirmes(): number {
    return this.donations.filter((donation) => {
      const status = String(donation.status || '').toLowerCase();

      return (
        status === 'confirmé' ||
        status === 'confirme' ||
        status === 'confirmed' ||
        status === 'success' ||
        status === 'paid'
      );
    }).length;
  }

  get nombreEnAttente(): number {
    return Math.max(this.donations.length - this.nombreConfirmes, 0);
  }


  loadRapports(): void {
    this.rapportService.getRapports().subscribe({
      next: (response: any) => {
       

        if (Array.isArray(response)) {
          this.rapports = response;
        } else if (Array.isArray(response?.rapports)) {
          this.rapports = response.rapports;
        } else if (Array.isArray(response?.data)) {
          this.rapports = response.data;
        } else {
          this.rapports = [];
        }
      },

      error: (error) => {
        console.error('Error loading reports:', error);

        this.rapports = [];
      },
    });
  }

  get filteredRapports(): any[] {
    const search = this.rapportSearch.trim().toLowerCase();

    if (!search) {
      return this.rapports;
    }

    return this.rapports.filter((rapport) => {
      const value = `
          ${rapport.titre || ''}
          ${rapport.type || ''}
          ${rapport.date || ''}
        `.toLowerCase();

      return value.includes(search);
    });
  }

  loadBeneficiaries(): void {
    if (!this.donorId) {
      return;
    }

    this.donorService.getDonorWithBeneficiaries(this.donorId).subscribe({
      next: (response: any) => {
       

        const data = response?.donor || response?.data || response;

        this.parrainages =
          data?.assignedBeneficiaries ||
          response?.assignedBeneficiaries ||
          response?.beneficiaries ||
          [];
      },

      error: (error) => {
        console.error('Error loading beneficiaries:', error);

        this.parrainages = [];
      },
    });
  }

  get totalEnfants(): number {
    return this.parrainages.reduce((total, beneficiary) => {
      const children = beneficiary.children || [];

      return total + (Array.isArray(children) ? children.length : 0);
    }, 0);
  }

  
  submitDonation(): void {
    if (
      !this.nom?.trim() ||
      !this.email?.trim() ||
      !this.montant ||
      Number(this.montant) <= 0
    ) {
      this.donationError =
        'Veuillez renseigner un nom, un email et un montant valide.';

      return;
    }

    this.donationError = '';

    this.donationDone = true;
  }

  resetDonation(): void {
    this.donationDone = false;

    this.montant = '';

    this.donationError = '';
  }
}
