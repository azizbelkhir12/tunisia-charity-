import { Component, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { forkJoin, Observable, of } from 'rxjs';
import {
  catchError,
  finalize,
  map,
  switchMap,
} from 'rxjs/operators';
import {
  Check,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  HandHeart,
  PlusCircle,
  Search,
  Users,
  Wallet,
} from 'lucide-angular';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { DonationService } from '../services/donation/donation.service';
import { DonorsService } from '../services/donors/donors.service';

type DonStatus = 'en_attente' | 'confirme';
type DonType = 'local' | 'international';
type PayMode = 'virement' | 'en_ligne' | 'cash';
type ViewType = 'ajouter' | 'donateurs' | 'dons';
type DonStatusFilter = 'all' | DonStatus;

interface ApiDonor {
  _id?: string;
  id?: string;
  nomComplet?: string;
  name?: string;
  nom?: string;
  prenom?: string;
  Prenom?: string;
  email?: string;
  telephone?: string;
  phone?: string;
  adresse?: string;
  address?: string;
  zipCode?: string;
  status?: string;
  statut?: string;
  active?: boolean;
  isActive?: boolean;
}

interface ApiDonation {
  _id?: string;
  id?: string;
  amount?: number | string;
  montant?: number | string;
  total?: number | string;
  type?: string;
  donationType?: string;
  paymentMethod?: string;
  modePaiement?: string;
  payment_method?: string;
  mode?: string;
  status?: string;
  statut?: string;
  createdAt?: string | Date;
  date?: string | Date;
  donationDate?: string | Date;
  donor?: ApiDonor | string;
  donorId?: ApiDonor | string;
}

interface Donor {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  zipCode: string;
  status: 'active' | 'inactive';
}

interface Don {
  id: string;
  donorId: string;
  donateur: string;
  email: string;
  montant: number;
  type: DonType;
  mode: PayMode;
  status: DonStatus;
  date: string;
}

interface DonForm {
  nom: string;
  email: string;
  montant: string;
  mode: PayMode;
  status: DonStatus;
  type: DonType;
}

type ApiPaymentMethod =| 'cash'| 'credit_card'| 'bank_transfer';

type ApiDonationStatus =| 'pending'| 'completed';

interface FormErrors {
  nom?: string;
  email?: string;
  montant?: string;
}

interface StatsCard {
  label: string;
  value: string;
  icon: typeof Wallet;
  colorClass: string;
}

interface DonorDonationGroup {
  donor: ApiDonor;
  donations: ApiDonation[];
}


@Component({
  selector: 'app-gestion-des-dons',
  templateUrl: './gestion-des-dons.component.html',
  styleUrls: ['./gestion-des-dons.component.css'],
  standalone:false
})
export class GestionDesDonsComponent implements OnInit {

  readonly WalletIcon = Wallet;
  readonly UsersIcon = Users;
  readonly HandHeartIcon = HandHeart;
  readonly ClockIcon = Clock;
  readonly SearchIcon = Search;
  readonly DownloadIcon = Download;
  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly FileTextIcon = FileText;
  readonly PlusCircleIcon = PlusCircle;
  readonly CheckIcon = Check;

  readonly paymentMethodApiMap: Record<
  PayMode,
  ApiPaymentMethod
> = {
  cash: 'cash',
  en_ligne: 'credit_card',
  virement: 'bank_transfer',
};

readonly donationStatusApiMap: Record<
  DonStatus,
  ApiDonationStatus
> = {
  en_attente: 'pending',
  confirme: 'completed',
};

  readonly modeLabel: Record<PayMode, string> = {
    virement: 'Virement',
    en_ligne: 'En ligne',
    cash: 'Espèces',
  };

  readonly typeLabel: Record<DonType, string> = {
    local: 'Local',
    international: 'International',
  };

  readonly statusLabel: Record<DonStatus, string> = {
    en_attente: 'En attente',
    confirme: 'Confirmé',
  };

  readonly tabs: Array<{ key: ViewType; label: string }> = [
    { key: 'ajouter', label: 'Ajouter don' },
    { key: 'donateurs', label: 'Voir liste donateurs' },
    { key: 'dons', label: 'Voir liste des dons' },
  ];

  donors: Donor[] = [];
  dons: Don[] = [];

  view: ViewType = 'ajouter';

  form: DonForm = this.createEmptyForm();
  errors: FormErrors = {};
  saved = false;
  loading = false;
  isSubmitting = false;
  apiError = '';

  qDonors = '';
  qDons = '';
  donStatusFilter: DonStatusFilter = 'all';

  private apiDonors: ApiDonor[] = [];
  private savedTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly donationService: DonationService,
    private readonly donorsService: DonorsService,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Donateurs — Admin Tunisia Charity');
    this.metaService.updateTag({ name: 'robots', content: 'noindex' });
    this.loadData();
  }

  get totalAmount(): number {
    return this.dons.reduce((sum, don) => sum + don.montant, 0);
  }

  get pendingCount(): number {
    return this.dons.filter((don) => don.status === 'en_attente').length;
  }

  get statsCards(): StatsCard[] {
    return [
      {
        label: 'Total des dons',
        value: `${this.formatNumber(this.totalAmount)} TND`,
        icon: this.WalletIcon,
        colorClass: 'stat-icon-primary',
      },
      {
        label: 'Donateurs',
        value: this.formatNumber(this.donors.length),
        icon: this.UsersIcon,
        colorClass: 'stat-icon-emerald',
      },
      {
        label: 'Dons enregistrés',
        value: this.formatNumber(this.dons.length),
        icon: this.HandHeartIcon,
        colorClass: 'stat-icon-sky',
      },
      {
        label: 'Dons en attente',
        value: this.formatNumber(this.pendingCount),
        icon: this.ClockIcon,
        colorClass: 'stat-icon-amber',
      },
    ];
  }

  get filteredDonors(): Donor[] {
  const query = this.qDonors.trim().toLowerCase();

  if (!query) {
    return this.donors;
  }

  return this.donors.filter((donor) =>
    [
      donor.nom,
      donor.email,
      donor.telephone,
      donor.adresse,
      donor.zipCode,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
}

  get filteredDons(): Don[] {
    const query = this.qDons.trim().toLowerCase();

    return this.dons.filter((don) => {
      if (
        this.donStatusFilter !== 'all' &&
        don.status !== this.donStatusFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        don.donateur,
        don.email,
        this.typeLabel[don.type],
        this.modeLabel[don.mode],
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  setView(view: ViewType): void {
    this.view = view;
  }

  loadData(): void {
    this.loading = true;
    this.apiError = '';

    this.donorsService
      .getDonors()
      .pipe(
        switchMap((response: unknown) => {
          this.apiDonors = this.extractArray<ApiDonor>(response, [
            'donors',
            'donateurs',
          ]);

          this.donors = this.apiDonors
            .map((donor) => this.mapDonor(donor))
            .filter((donor) => Boolean(donor.id));

          return this.loadDonationsForDonors(this.apiDonors);
        }),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (groups) => {
          this.dons = groups
            .flatMap((group) =>
              group.donations.map((donation) =>
                this.mapDonation(donation, group.donor),
              ),
            )
            .sort(
              (first, second) =>
                new Date(second.date).getTime() -
                new Date(first.date).getTime(),
            );
        },
        error: (error) => {
          this.donors = [];
          this.dons = [];
          this.apiError = this.extractApiError(
            error,
            'Impossible de charger les donateurs et les dons.',
          );
        },
      });
  }

  private generatePaymentId(): string {
  const uniquePart =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;

  return `MANUAL-${uniquePart}`;
}



  submitDon(): void {
  const errors: FormErrors = {};

  const name = this.form.nom.trim();
  const email = this.form.email.trim().toLowerCase();
  const amount = Number(this.form.montant);

  // Validation du nom
  if (!name) {
    errors.nom = 'Le nom est requis';
  }

  // Validation de l'adresse e-mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Adresse e-mail invalide';
  }

  // Validation du montant
  if (
    !this.form.montant ||
    Number.isNaN(amount) ||
    amount <= 0
  ) {
    errors.montant = 'Montant invalide';
  }

  this.errors = errors;
  this.apiError = '';

  if (Object.keys(errors).length > 0) {
    return;
  }

  const existingDonor = this.donors.find(
    (donor) =>
      donor.email.trim().toLowerCase() === email,
  );

  /*
   * Conversion des valeurs du formulaire vers
   * les enums exacts du modèle Mongoose.
   */
  const paymentMethodMap: Record<
    PayMode,
    'cash' | 'credit_card' | 'bank_transfer'
  > = {
    cash: 'cash',
    en_ligne: 'credit_card',
    virement: 'bank_transfer',
  };

  const statusMap: Record<
    DonStatus,
    'pending' | 'completed'
  > = {
    en_attente: 'pending',
    confirme: 'completed',
  };

  /*
   * Génération d'un paymentId unique.
   */
  const uniquePaymentPart =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 12)}`;

  const paymentId = `MANUAL-${uniquePaymentPart}`;

  const donationPayload: {
    amount: number;
    donorId?: string;
    guestName: string | null;
    guestEmail: string | null;
    paymentMethod:
      | 'cash'
      | 'credit_card'
      | 'bank_transfer';
    paymentType: 'local' | 'international';
    status: 'pending' | 'completed';
    project: 'don generale';
    paymentId: string;
    paymentDetails: {
      source: string;
      createdFrom: string;
    };
    date: string;
  } = {
    amount,

    paymentMethod:
      paymentMethodMap[this.form.mode],

    paymentType: this.form.type,

    status:
      statusMap[this.form.status],

    project: 'don generale',

    paymentId,

    paymentDetails: {
      source: 'manual',
      createdFrom: 'admin-dashboard',
    },

    date: new Date().toISOString(),

    /*
     * Si la personne n'est pas enregistrée,
     * ses informations sont sauvegardées comme invité.
     */
    guestName: existingDonor ? null : name,
    guestEmail: existingDonor ? null : email,
  };

  
  if (existingDonor?.id) {
    donationPayload.donorId = existingDonor.id;
  }


  this.isSubmitting = true;

  this.donationService
    .createDonation(donationPayload)
    .pipe(
      finalize(() => {
        this.isSubmitting = false;
      }),
    )
    .subscribe({
      next: (response: any) => {
        const createdDonation =
          response?.donation ??
          response?.data?.donation ??
          response?.data ??
          response;

        const newDonation: Don = {
          id: String(
            createdDonation?._id ??
              createdDonation?.id ??
              paymentId,
          ),

          donorId:
            existingDonor?.id ??
            String(
              createdDonation?.donorId ?? '',
            ),

          donateur:
            existingDonor?.nom ??
            createdDonation?.guestName ??
            name,

          email:
            existingDonor?.email ??
            createdDonation?.guestEmail ??
            email,

          montant: Number(
            createdDonation?.amount ?? amount,
          ),

          type:
            createdDonation?.paymentType ===
            'international'
              ? 'international'
              : this.form.type,

          mode: this.form.mode,

          status:
            createdDonation?.status === 'completed'
              ? 'confirme'
              : createdDonation?.status === 'pending'
                ? 'en_attente'
                : this.form.status,

          date:
            createdDonation?.date ??
            createdDonation?.createdAt ??
            new Date().toISOString(),
        };

        this.dons = [
          newDonation,
          ...this.dons.filter(
            (donation) =>
              donation.id !== newDonation.id,
          ),
        ];

        this.form = this.createEmptyForm();
        this.errors = {};
        this.apiError = '';

        this.showSavedMessage();
      },

      error: (error) => {
        console.error(
          'Erreur createDonation :',
          error,
        );

        this.apiError = this.extractApiError(
          error,
          "Impossible d'enregistrer le don.",
        );
      },
    });
}

  exportDonorsXLSX(): void {
  const rows = this.filteredDonors.map((donor) => ({
    Nom: donor.nom,
    Email: donor.email,
    Téléphone: donor.telephone,
    Adresse: donor.adresse,
    'Code postal': donor.zipCode,
    Statut: donor.status === 'active' ? 'Actif' : 'Inactif',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Donateurs',
  );

  XLSX.writeFile(
    workbook,
    `donateurs-${this.today()}.xlsx`,
  );
}

  exportDonorsPDF(): void {
  const document = new jsPDF({
    orientation: 'landscape',
  });

  document.setFontSize(14);
  document.text(
    'Liste des donateurs — Tunisia Charity',
    14,
    15,
  );

  document.setFontSize(10);
  document.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
    14,
    22,
  );

  autoTable(document, {
    startY: 28,
    head: [
      [
        'Nom',
        'Email',
        'Téléphone',
        'Adresse',
        'Code postal',
        'Statut',
      ],
    ],
    body: this.filteredDonors.map((donor) => [
      donor.nom,
      donor.email,
      donor.telephone,
      donor.adresse,
      donor.zipCode,
      donor.status === 'active' ? 'Actif' : 'Inactif',
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [28, 72, 117],
    },
  });

  document.save(`donateurs-${this.today()}.pdf`);
}

  exportDonsXLSX(): void {
    const rows = this.filteredDons.map((don) => ({
      Donateur: don.donateur,
      'Montant (TND)': don.montant,
      'Type de don': this.typeLabel[don.type],
      'Mode de paiement': this.modeLabel[don.mode],
      Statut: this.statusLabel[don.status],
      Date: this.formatDate(don.date),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dons');
    XLSX.writeFile(workbook, `dons-${this.today()}.xlsx`);
  }

  exportDonsPDF(): void {
    const document = new jsPDF({ orientation: 'landscape' });

    document.setFontSize(14);
    document.text('Liste des dons — Tunisia Charity', 14, 15);
    document.setFontSize(10);
    document.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      14,
      22,
    );

    autoTable(document, {
      startY: 28,
      head: [
        [
          'Donateur',
          'Montant (TND)',
          'Type de don',
          'Mode de paiement',
          'Statut',
          'Date',
        ],
      ],
      body: this.filteredDons.map((don) => [
        don.donateur,
        this.formatNumber(don.montant),
        this.typeLabel[don.type],
        this.modeLabel[don.mode],
        this.statusLabel[don.status],
        this.formatDate(don.date),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [28, 72, 117] },
    });

    document.save(`dons-${this.today()}.pdf`);
  }

  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  formatDate(date: string): string {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('fr-FR');
  }

  trackById(_index: number, item: Donor | Don): string {
    return item.id;
  }

  trackByLabel(_index: number, item: StatsCard): string {
    return item.label;
  }

  trackByTab(_index: number, item: { key: ViewType }): ViewType {
    return item.key;
  }

  ngOnDestroy(): void {
    if (this.savedTimeout) {
      clearTimeout(this.savedTimeout);
    }
  }

  private loadDonationsForDonors(
    donors: ApiDonor[],
  ): Observable<DonorDonationGroup[]> {
    const requests = donors
      .map((donor) => {
        const donorId = this.getDonorId(donor);

        if (!donorId) {
          return null;
        }

        return this.donorsService
          .getDonationsByDonorId(donorId)
          .pipe(
            map((response) => ({
              donor,
              donations:
                response?.success === false
                  ? []
                  : Array.isArray(response?.donations)
                    ? response.donations
                    : [],
            })),
            catchError(() =>
              of({
                donor,
                donations: [] as ApiDonation[],
              }),
            ),
          );
      })
      .filter(
        (
          request,
        ): request is Observable<DonorDonationGroup> => request !== null,
      );

    return requests.length > 0 ? forkJoin(requests) : of([]);
  }

  private mapDonor(donor: ApiDonor): Donor {
  return {
    id: this.getDonorId(donor),
    nom: this.getDonorName(donor),
    email: donor.email?.trim() || '—',
    telephone:
      donor.telephone?.trim() ||
      donor.phone?.trim() ||
      '—',
    adresse:
      donor.adresse?.trim() ||
      donor.address?.trim() ||
      '—',
    zipCode: donor.zipCode?.trim() || '—',
    status: this.normalizeDonorStatus(donor),
  };
}
  private mapDonation(
    donation: ApiDonation,
    fallbackDonor: ApiDonor,
  ): Don {
    const populatedDonor = this.getPopulatedDonor(donation) ?? fallbackDonor;
    const donorId =
      this.getDonationDonorId(donation) || this.getDonorId(fallbackDonor);

    return {
      id:
        String(donation._id ?? donation.id ?? '') ||
        `${donorId}-${this.getDonationDate(donation)}-${this.getDonationAmount(donation)}`,
      donorId,
      donateur: this.getDonorName(populatedDonor),
      email: populatedDonor.email?.trim() || fallbackDonor.email?.trim() || '—',
      montant: this.getDonationAmount(donation),
      type: this.normalizeDonationType(
        donation.type ?? donation.donationType ?? '',
      ),
      mode: this.normalizePaymentMode(
        donation.paymentMethod ??
          donation.modePaiement ??
          donation.payment_method ??
          donation.mode ??
          '',
      ),
      status: this.normalizeDonationStatus(
        donation.status ?? donation.statut ?? '',
      ),
      date: this.getDonationDate(donation),
    };
  }

  private getDonorId(donor: ApiDonor): string {
    return String(donor._id ?? donor.id ?? '');
  }

  private getDonorName(donor: ApiDonor): string {
    const explicitName = donor.nomComplet ?? donor.name;

    if (explicitName?.trim()) {
      return explicitName.trim();
    }

    const firstName = donor.prenom ?? donor.Prenom ?? '';
    const lastName = donor.nom ?? '';
    const fullName = [firstName, lastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ');

    return fullName || donor.email?.trim() || 'Donateur';
  }

  private normalizeDonorStatus(
    donor: ApiDonor,
  ): 'active' | 'inactive' {
    if (donor.active === false || donor.isActive === false) {
      return 'inactive';
    }

    const status = String(donor.status ?? donor.statut ?? '')
      .trim()
      .toLowerCase();

    if (
      ['inactive', 'inactif', 'disabled', 'suspended', 'bloque', 'bloqué'].includes(
        status,
      )
    ) {
      return 'inactive';
    }

    return 'active';
  }

  private getDonationAmount(donation: ApiDonation): number {
    const value =
      donation.amount ?? donation.montant ?? donation.total ?? 0;
    const amount = Number(value);

    return Number.isFinite(amount) ? amount : 0;
  }

  private getDonationDate(donation: ApiDonation): string {
    const rawDate =
      donation.createdAt ?? donation.date ?? donation.donationDate;

    if (!rawDate) {
      return this.today();
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return this.today();
    }

    return date.toISOString();
  }

  private normalizeDonationType(value: string): DonType {
    const type = String(value).trim().toLowerCase();

    return type.includes('international') || type.includes('etranger')
      ? 'international'
      : 'local';
  }

  private normalizePaymentMode(value: string): PayMode {
    const mode = String(value).trim().toLowerCase();

    if (
      mode.includes('online') ||
      mode.includes('ligne') ||
      mode.includes('card') ||
      mode.includes('carte')
    ) {
      return 'en_ligne';
    }

    if (
      mode.includes('cash') ||
      mode.includes('espèce') ||
      mode.includes('espece')
    ) {
      return 'cash';
    }

    return 'virement';
  }

  private normalizeDonationStatus(value: string): DonStatus {
    const status = String(value).trim().toLowerCase();

    if (
      [
        'confirme',
        'confirmé',
        'confirmed',
        'paid',
        'complete',
        'completed',
        'success',
      ].includes(status)
    ) {
      return 'confirme';
    }

    return 'en_attente';
  }

  private getPopulatedDonor(
    donation: ApiDonation,
  ): ApiDonor | null {
    if (donation.donor && typeof donation.donor === 'object') {
      return donation.donor;
    }

    if (donation.donorId && typeof donation.donorId === 'object') {
      return donation.donorId;
    }

    return null;
  }

  private getDonationDonorId(donation: ApiDonation): string {
    if (typeof donation.donor === 'string') {
      return donation.donor;
    }

    if (typeof donation.donorId === 'string') {
      return donation.donorId;
    }

    const populatedDonor = this.getPopulatedDonor(donation);

    return populatedDonor ? this.getDonorId(populatedDonor) : '';
  }

  private extractArray<T>(
    response: unknown,
    possibleKeys: string[],
  ): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const objectResponse = response as Record<string, unknown>;

    for (const key of possibleKeys) {
      const value = objectResponse[key];

      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    const data = objectResponse['data'];

    if (Array.isArray(data)) {
      return data as T[];
    }

    if (data && typeof data === 'object') {
      const nestedData = data as Record<string, unknown>;

      for (const key of possibleKeys) {
        const value = nestedData[key];

        if (Array.isArray(value)) {
          return value as T[];
        }
      }
    }

    return [];
  }

  private extractApiError(error: any, fallback: string): string {
    return (
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      fallback
    );
  }

  private showSavedMessage(): void {
    this.saved = true;

    if (this.savedTimeout) {
      clearTimeout(this.savedTimeout);
    }

    this.savedTimeout = setTimeout(() => {
      this.saved = false;
    }, 3500);
  }

  private createEmptyForm(): DonForm {
    return {
      nom: '',
      email: '',
      montant: '',
      mode: 'virement',
      status: 'en_attente',
      type: 'local',
    };
  }

  private today(): string {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000,
    );

    return localDate.toISOString().slice(0, 10);
  }


}


