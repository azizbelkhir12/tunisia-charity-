import { Component, OnInit } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Adapte uniquement les chemins et les noms de ces services
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import { DonorsService } from '../services/donors/donors.service';
import { DonationService } from '../services/donation/donation.service';
import { ProjetService } from '../services/projet/projet.service';
import { RapportService } from '../services/rapport/rapport.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';

type DashboardRange = '7j' | '30j' | '12m';

interface DashboardKpi {
  label: string;
  value: number;
  delta: number;
  up: boolean;
  icon: string;
}

interface DonationData {
  month: string;
  value: number;
}

interface ProjectShare {
  label: string;
  value: number;
  color: string;
}

interface PaymentMethod {
  label: string;
  value: number;
}

interface TopProject {
  name: string;
  raised: number;
  goal: number;
}

interface RecentActivity {
  title: string;
  date: string;
}

interface DonutSegment extends ProjectShare {
  dashArray: string;
  dashOffset: number;
}

interface DatedActivity extends RecentActivity {
  rawDate: Date;
}

@Component({
  selector: 'app-admin-compte',
  templateUrl: './admin-compte.component.html',
  standalone:false,
  styleUrls: ['./admin-compte.component.css']
})
export class AdminCompteComponent  {
  selectedRange: DashboardRange = '12m';
  showStats = false;

  isLoading = false;
  loadError = false;

  kpis: DashboardKpi[] = [
    {
      label: 'Donateurs',
      value: 0,
      delta: 0,
      up: true,
      icon: 'hand-heart',
    },
    {
      label: 'Bénévoles',
      value: 0,
      delta: 0,
      up: true,
      icon: 'users',
    },
    {
      label: 'Bénéficiaires',
      value: 0,
      delta: 0,
      up: true,
      icon: 'heart-handshake',
    },
    {
      label: 'Projets actifs',
      value: 0,
      delta: 0,
      up: true,
      icon: 'folder-kanban',
    },
  ];

  donations12m: DonationData[] = [];

  projectShare: ProjectShare[] = [];

  paymentMethods: PaymentMethod[] = [];

  topProjects: TopProject[] = [];

  recentActivities: RecentActivity[] = [];

  readonly ranges: DashboardRange[] = [
    '7j',
    '30j',
    '12m',
  ];

  totalDons = 0;
  maxDonation = 0;

  readonly donutRadius = 60;

  readonly donutCircumference =
    2 * Math.PI * this.donutRadius;

  donutSegments: DonutSegment[] = [];

  constructor(
    private beneficiaryService: BeneficiaryService,
    private donorService: DonorsService,
    private donationService: DonationService,
    private projectService: ProjetService,
    private rapportService: RapportService,
    private volunteerService: VolunteerService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadError = false;

    forkJoin({
      beneficiaires: this.safeRequest(
        this.beneficiaryService.getBeneficiaires(),
        'bénéficiaires',
      ),

      donors: this.safeRequest(
        this.donorService.getDonors(),
        'donateurs',
      ),

      donations: this.safeRequest(
        this.donationService.getDonations(),
        'dons',
      ),

      projects: this.safeRequest(
        this.projectService.getProjects(),
        'projets',
      ),

      rapports: this.safeRequest(
        this.rapportService.getRapports(),
        'rapports',
      ),

      volunteers: this.safeRequest(
        this.volunteerService.getVolunteers(),
        'bénévoles',
      ),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: responses => {
          const beneficiaires = this.extractArray(
            responses.beneficiaires,
            ['beneficiaires', 'beneficiaries', 'data'],
          );

          const donors = this.extractArray(
            responses.donors,
            ['donors', 'donateurs', 'data'],
          );

          const donations = this.extractArray(
            responses.donations,
            ['donations', 'dons', 'data'],
          );

          const projects = this.extractArray(
            responses.projects,
            ['projects', 'projets', 'data'],
          );

          const rapports = this.extractArray(
            responses.rapports,
            ['rapports', 'reports', 'data'],
          );

          const volunteers = this.extractArray(
            responses.volunteers,
            ['volunteers', 'benevoles', 'data'],
          );

          this.updateKpis(
            donors,
            volunteers,
            beneficiaires,
            projects,
          );

          this.updateDonationsChart(donations);
          this.updatePaymentMethods(donations);
          this.updateProjectShare(projects);
          this.updateTopProjects(projects);

          this.updateRecentActivities(
            donations,
            volunteers,
            rapports,
            projects,
          );
        },

        error: error => {
          console.error(
            'Erreur pendant le chargement du dashboard :',
            error,
          );

          this.loadError = true;
        },
      });
  }

  private updateKpis(
    donors: any[],
    volunteers: any[],
    beneficiaries: any[],
    projects: any[],
  ): void {
    const activeProjects = this.getActiveProjects(projects);

    const donorsGrowth =
      this.calculateMonthlyGrowth(donors);

    const volunteersGrowth =
      this.calculateMonthlyGrowth(volunteers);

    const beneficiariesGrowth =
      this.calculateMonthlyGrowth(beneficiaries);

    const projectsGrowth =
      this.calculateMonthlyGrowth(activeProjects);

    this.kpis = [
      {
        label: 'Donateurs',
        value: donors.length,
        delta: donorsGrowth.delta,
        up: donorsGrowth.up,
        icon: 'hand-heart',
      },
      {
        label: 'Bénévoles',
        value: volunteers.length,
        delta: volunteersGrowth.delta,
        up: volunteersGrowth.up,
        icon: 'users',
      },
      {
        label: 'Bénéficiaires',
        value: beneficiaries.length,
        delta: beneficiariesGrowth.delta,
        up: beneficiariesGrowth.up,
        icon: 'heart-handshake',
      },
      {
        label: 'Projets actifs',
        value: activeProjects.length,
        delta: projectsGrowth.delta,
        up: projectsGrowth.up,
        icon: 'folder-kanban',
      },
    ];
  }

  private updateDonationsChart(
    donations: any[],
  ): void {
    const today = new Date();

    const buckets = new Map<
      string,
      {
        month: string;
        value: number;
      }
    >();

    for (let index = 11; index >= 0; index--) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - index,
        1,
      );

      const key = this.getMonthKey(date);

      buckets.set(key, {
        month: this.getMonthLabel(date),
        value: 0,
      });
    }

    let donationsWithValidDate = 0;

    donations.forEach(donation => {
      const amount = this.readNumber(donation, [
        'amount',
        'montant',
        'value',
        'donationAmount',
        'donation_amount',
        'total',
      ]);

      const date = this.readDate(donation);

      if (!date) {
        return;
      }

      const key = this.getMonthKey(date);
      const bucket = buckets.get(key);

      if (!bucket) {
        return;
      }

      bucket.value += amount;
      donationsWithValidDate++;
    });

    /*
     * Si le backend ne renvoie aucune date,
     * le total est placé dans le mois courant.
     */
    if (
      donations.length > 0 &&
      donationsWithValidDate === 0
    ) {
      const currentKey = this.getMonthKey(today);
      const currentBucket = buckets.get(currentKey);

      if (currentBucket) {
        currentBucket.value = donations.reduce(
          (sum, donation) =>
            sum +
            this.readNumber(donation, [
              'amount',
              'montant',
              'value',
              'donationAmount',
              'donation_amount',
              'total',
            ]),
          0,
        );
      }
    }

    this.donations12m = Array.from(
      buckets.values(),
    );

    this.totalDons = this.donations12m.reduce(
      (sum, donation) => sum + donation.value,
      0,
    );

    this.maxDonation = Math.max(
      0,
      ...this.donations12m.map(
        donation => donation.value,
      ),
    );
  }

  private updatePaymentMethods(
    donations: any[],
  ): void {
    const methodCounters = new Map<string, number>();

    donations.forEach(donation => {
      const rawMethod = this.readString(donation, [
        'paymentMethod',
        'payment_method',
        'modePaiement',
        'mode_paiement',
        'method',
        'methode',
      ]);

      const method =
        this.normalizePaymentMethod(rawMethod);

      methodCounters.set(
        method,
        (methodCounters.get(method) ?? 0) + 1,
      );
    });

    const total = donations.length;

    this.paymentMethods = Array.from(
      methodCounters.entries(),
    )
      .map(([label, count]) => ({
        label,
        value:
          total > 0
            ? Math.round((count / total) * 100)
            : 0,
      }))
      .sort((first, second) =>
        second.value - first.value,
      );
  }

  private updateProjectShare(
    projects: any[],
  ): void {
    const colors = [
      '#1C4875',
      '#4A7BB0',
      '#7BA6D4',
      '#A9C6E4',
      '#D3E0EE',
    ];

    const categoryTotals = new Map<string, number>();

    projects.forEach(project => {
      const category =
        this.readString(project, [
          'category',
          'categorie',
          'domain',
          'domaine',
          'type',
        ]) || 'Autres';

      const collectedAmount =
        this.readNumber(project, [
          'raised',
          'amountRaised',
          'collectedAmount',
          'montantCollecte',
          'montant_collecte',
          'currentAmount',
        ]);

      /*
       * Si le montant collecté n'existe pas,
       * chaque projet compte pour 1.
       */
      const value =
        collectedAmount > 0
          ? collectedAmount
          : 1;

      categoryTotals.set(
        category,
        (categoryTotals.get(category) ?? 0) +
          value,
      );
    });

    const total = Array.from(
      categoryTotals.values(),
    ).reduce(
      (sum, value) => sum + value,
      0,
    );

    this.projectShare = Array.from(
      categoryTotals.entries(),
    )
      .map(([label, value], index) => ({
        label,
        value:
          total > 0
            ? Math.round((value / total) * 100)
            : 0,
        color: colors[index % colors.length],
      }))
      .sort((first, second) =>
        second.value - first.value,
      );

    this.donutSegments =
      this.createDonutSegments();
  }

  private updateTopProjects(
    projects: any[],
  ): void {
    this.topProjects = projects
      .map(project => ({
        name:
          this.readString(project, [
            'title',
            'name',
            'nom',
            'projectName',
            'project_name',
          ]) || 'Projet sans nom',

        raised: this.readNumber(project, [
          'raised',
          'amountRaised',
          'collectedAmount',
          'montantCollecte',
          'montant_collecte',
          'currentAmount',
        ]),

        goal: this.readNumber(project, [
          'goal',
          'targetAmount',
          'target_amount',
          'objectif',
          'budget',
          'requiredAmount',
        ]),
      }))
      .filter(project => project.goal > 0)
      .sort(
        (first, second) =>
          second.raised - first.raised,
      )
      .slice(0, 4);
  }

  private updateRecentActivities(
    donations: any[],
    volunteers: any[],
    rapports: any[],
    projects: any[],
  ): void {
    const activities: DatedActivity[] = [];

    donations.forEach(donation => {
      const date = this.readDate(donation);

      if (!date) {
        return;
      }

      const amount = this.readNumber(donation, [
        'amount',
        'montant',
        'value',
        'donationAmount',
      ]);

      const projectName = this.readString(
        donation,
        [
          'projectName',
          'project_name',
          'projectTitle',
          'project',
        ],
      );

      activities.push({
        title:
          `Nouveau don de ${this.formatNumber(amount)} TND` +
          (projectName
            ? ` — Projet ${projectName}`
            : ''),
        date: this.formatRelativeDate(date),
        rawDate: date,
      });
    });

    volunteers.forEach(volunteer => {
      const date = this.readDate(volunteer);

      if (!date) {
        return;
      }

      const fullName =
        this.getPersonFullName(volunteer);

      activities.push({
        title:
          `Nouvelle inscription bénévole` +
          (fullName ? ` — ${fullName}` : ''),
        date: this.formatRelativeDate(date),
        rawDate: date,
      });
    });

    rapports.forEach(rapport => {
      const date = this.readDate(rapport);

      if (!date) {
        return;
      }

      const title = this.readString(rapport, [
        'title',
        'titre',
        'name',
        'nom',
      ]);

      activities.push({
        title: title
          ? `${title} publié`
          : 'Nouveau rapport publié',
        date: this.formatRelativeDate(date),
        rawDate: date,
      });
    });

    projects.forEach(project => {
      const date = this.readDate(project);

      if (!date) {
        return;
      }

      const name = this.readString(project, [
        'title',
        'name',
        'nom',
      ]);

      activities.push({
        title: name
          ? `Projet « ${name} » mis à jour`
          : 'Projet mis à jour',
        date: this.formatRelativeDate(date),
        rawDate: date,
      });
    });

    this.recentActivities = activities
      .sort(
        (first, second) =>
          second.rawDate.getTime() -
          first.rawDate.getTime(),
      )
      .slice(0, 4)
      .map(({ title, date }) => ({
        title,
        date,
      }));
  }

  private getActiveProjects(
    projects: any[],
  ): any[] {
    const hasStatusInformation = projects.some(
      project =>
        project.status !== undefined ||
        project.statut !== undefined ||
        project.isActive !== undefined ||
        project.active !== undefined,
    );

    if (!hasStatusInformation) {
      return projects;
    }

    return projects.filter(project => {
      if (
        project.isActive === true ||
        project.active === true
      ) {
        return true;
      }

      const status = this.readString(project, [
        'status',
        'statut',
        'state',
        'etat',
      ])
        .trim()
        .toLowerCase();

      return [
        'active',
        'actif',
        'en cours',
        'ongoing',
        'published',
        'publié',
        'publie',
      ].includes(status);
    });
  }

  private calculateMonthlyGrowth(
    items: any[],
  ): {
    delta: number;
    up: boolean;
  } {
    const now = new Date();

    const currentMonthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const currentMonthCount = items.filter(item => {
      const date = this.readDate(item);

      return (
        date !== null &&
        date >= currentMonthStart &&
        date <= now
      );
    }).length;

    const previousMonthCount = items.filter(item => {
      const date = this.readDate(item);

      return (
        date !== null &&
        date >= previousMonthStart &&
        date < currentMonthStart
      );
    }).length;

    if (
      currentMonthCount === 0 &&
      previousMonthCount === 0
    ) {
      return {
        delta: 0,
        up: true,
      };
    }

    if (previousMonthCount === 0) {
      return {
        delta: currentMonthCount > 0 ? 100 : 0,
        up: true,
      };
    }

    const delta =
      ((currentMonthCount - previousMonthCount) /
        previousMonthCount) *
      100;

    return {
      delta: Math.abs(
        Number(delta.toFixed(1)),
      ),
      up: delta >= 0,
    };
  }

  private normalizePaymentMethod(
    method: string,
  ): string {
    const normalized = method
      .trim()
      .toLowerCase();

    if (
      normalized.includes('online') ||
      normalized.includes('ligne') ||
      normalized.includes('card') ||
      normalized.includes('carte')
    ) {
      return 'En ligne';
    }

    if (
      normalized.includes('virement') ||
      normalized.includes('bank') ||
      normalized.includes('bancaire')
    ) {
      return 'Virement';
    }

    if (
      normalized.includes('cash') ||
      normalized.includes('espèce') ||
      normalized.includes('espece')
    ) {
      return 'Espèces';
    }

    return method.trim() || 'Non renseigné';
  }

  private getPersonFullName(
    person: any,
  ): string {
    const firstName = this.readString(person, [
      'firstName',
      'firstname',
      'prenom',
      'Prenom',
    ]);

    const lastName = this.readString(person, [
      'lastName',
      'lastname',
      'name',
      'nom',
    ]);

    return `${firstName} ${lastName}`.trim();
  }

  private extractArray(
    response: any,
    possibleKeys: string[],
  ): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response) {
      return [];
    }

    for (const key of possibleKeys) {
      if (Array.isArray(response[key])) {
        return response[key];
      }
    }

    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }

      for (const key of possibleKeys) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }

    return [];
  }

  private readNumber(
    object: any,
    keys: string[],
  ): number {
    for (const key of keys) {
      const value = object?.[key];

      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        const number = Number(value);

        if (!Number.isNaN(number)) {
          return number;
        }
      }
    }

    return 0;
  }

  private readString(
    object: any,
    keys: string[],
  ): string {
    for (const key of keys) {
      const value = object?.[key];

      if (
        typeof value === 'string' &&
        value.trim()
      ) {
        return value.trim();
      }
    }

    return '';
  }

  private readDate(
    object: any,
  ): Date | null {
    const dateKeys = [
      'createdAt',
      'created_at',
      'updatedAt',
      'updated_at',
      'date',
      'donationDate',
      'donation_date',
      'publishedAt',
      'published_at',
      'registrationDate',
    ];

    for (const key of dateKeys) {
      const value = object?.[key];

      if (!value) {
        continue;
      }

      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }

  private getMonthLabel(date: Date): string {
    const label = new Intl.DateTimeFormat(
      'fr-FR',
      {
        month: 'short',
      },
    )
      .format(date)
      .replace('.', '');

    return (
      label.charAt(0).toUpperCase() +
      label.slice(1)
    );
  }

  private formatRelativeDate(
    date: Date,
  ): string {
    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / 60000,
    );

    const hours = Math.floor(
      difference / 3600000,
    );

    const days = Math.floor(
      difference / 86400000,
    );

    if (minutes < 1) {
      return "À l'instant";
    }

    if (minutes < 60) {
      return `Il y a ${minutes} min`;
    }

    if (hours < 24) {
      return `Il y a ${hours} h`;
    }

    if (days === 1) {
      return 'Hier';
    }

    if (days < 7) {
      return `Il y a ${days} j`;
    }

    return new Intl.DateTimeFormat(
      'fr-FR',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(date);
  }

  private safeRequest<T>(
    request: Observable<T>,
    label: string,
  ): Observable<T | null> {
    return request.pipe(
      catchError(error => {
        console.error(
          `Erreur de chargement des ${label} :`,
          error,
        );

        this.loadError = true;

        return of(null);
      }),
    );
  }

  toggleStatistics(): void {
    this.showStats = !this.showStats;
  }

  selectRange(
    range: DashboardRange,
  ): void {
    this.selectedRange = range;
  }

  getRangeLabel(
    range: DashboardRange,
  ): string {
    switch (range) {
      case '7j':
        return '7 jours';

      case '30j':
        return '30 jours';

      case '12m':
        return '12 mois';

      default:
        return range;
    }
  }

  getDonationHeight(
    value: number,
  ): number {
    if (this.maxDonation === 0) {
      return 0;
    }

    return (
      (value / this.maxDonation) *
      100
    );
  }

  getProjectPercentage(
    project: TopProject,
  ): number {
    if (project.goal === 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (project.raised / project.goal) *
          100,
      ),
    );
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(
      'fr-FR',
    ).format(value);
  }

  trackByLabel(
    index: number,
    item: { label: string },
  ): string {
    return item.label;
  }

  trackByMonth(
    index: number,
    item: DonationData,
  ): string {
    return item.month;
  }

  trackByProjectName(
    index: number,
    item: TopProject,
  ): string {
    return item.name;
  }

  trackByActivity(
    index: number,
    item: RecentActivity,
  ): string {
    return item.title;
  }

  trackByRange(
    index: number,
    range: DashboardRange,
  ): DashboardRange {
    return range;
  }

  private createDonutSegments(): DonutSegment[] {
    const total = this.projectShare.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    let currentOffset = 0;

    return this.projectShare.map(item => {
      const segmentLength =
        total > 0
          ? (item.value / total) *
            this.donutCircumference
          : 0;

      const segment: DonutSegment = {
        ...item,

        dashArray:
          `${segmentLength} ` +
          `${
            this.donutCircumference -
            segmentLength
          }`,

        dashOffset: -currentOffset,
      };

      currentOffset += segmentLength;

      return segment;
    });
  }
  
}
