import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import { DemandeService } from '../services/demande/demande.service';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

type VolunteerStatus = 'active' | 'inactive';
type VolunteerView = 'list' | 'requests';
type StatusFilter = 'all' | VolunteerStatus;

interface Volunteer {
  id: string | number;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  telephone: string;
  adresse: string;
  gouvernorat: string;
  status: VolunteerStatus;
}

interface JoinRequest {
  id: string | number;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  telephone: string;
  gouvernorat: string;
  motivation: string;
  date: string;
}

interface VolunteerStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

interface StatCard {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
}

const volunteers: Volunteer[] = [];

const REQUESTS_INIT: JoinRequest[] = []
@Component({
  selector: 'app-gestion-benevoles',
  templateUrl: './gestion-benevoles.component.html',
  standalone: false,
  styleUrls: ['./gestion-benevoles.component.css']
})
export class GestionBenevolesComponent implements OnInit {

  volunteers: Volunteer[] = [];
  requests: JoinRequest[] = [];

  view: VolunteerView = 'list';
  query = '';
  statusFilter: StatusFilter = 'all';

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly volunteerService: VolunteerService,
    private readonly demandeService: DemandeService,
  ) {}

 ngOnInit(): void {
  this.titleService.setTitle(
    'Bénévoles — Admin Tunisia Charity',
  );

  this.metaService.updateTag({
    name: 'robots',
    content: 'noindex',
  });

  this.loadVolunteers();
  this.loadDemandes();
}

  get stats(): VolunteerStats {
    const total = this.volunteers.length;

    const active = this.volunteers.filter(
      volunteer => volunteer.status === 'active',
    ).length;

    return {
      total,
      active,
      inactive: total - active,
      pending: this.requests.length,
    };
  }

  get statsCards(): StatCard[] {
    return [
      {
        label: 'Total bénévoles',
        value: this.stats.total,
        icon: 'users',
        colorClass: 'primary',
      },
      {
        label: 'Actifs',
        value: this.stats.active,
        icon: 'user-check',
        colorClass: 'success',
      },
      {
        label: 'Inactifs',
        value: this.stats.inactive,
        icon: 'user-x',
        colorClass: 'neutral',
      },
      {
        label: 'Demandes en attente',
        value: this.stats.pending,
        icon: 'clock',
        colorClass: 'warning',
      },
    ];
  }

  loadVolunteers(): void {
  this.volunteerService.getVolunteers().subscribe({
    next: (response: any[]) => {

      this.volunteers = response.map((volunteer: any) => ({
        id: volunteer.id ?? volunteer._id,

        nom:
          volunteer.nom ??
          volunteer.name ??
          '',

        prenom:
          volunteer.prenom ??
          volunteer.Prenom ??
          volunteer.lastName ??
          volunteer.lastname ??
          '',

        age: volunteer.age ?? 0,

        email: volunteer.email ?? '',

        telephone:
          volunteer.telephone ??
          volunteer.phone ??
          '',

        adresse:
          volunteer.adresse ??
          volunteer.address ??
          '—',

        gouvernorat:
          volunteer.gouvernorat ??
          '',

        status:
          volunteer.status === 'inactive'
            ? 'inactive'
            : 'active',
      }));
    },

    error: error => {
      console.error(
        'Erreur lors du chargement des bénévoles :',
        error,
      );

      this.volunteers = [];
    },
  });
}

loadDemandes(): void {
  this.demandeService.getAllDemandes().subscribe({
    next: (response: any) => {

      const demandes = Array.isArray(response)
        ? response
        : response?.demandes ??
          response?.data ??
          [];

      this.requests = demandes.map(
        (demande: any) => ({
          id: demande.id ?? demande._id,

          nom:
            demande.nom ??
            demande.name ??
            '',

          prenom:
            demande.prenom ??
            demande.Prenom ??
            demande.lastName ??
            demande.lastname ??
            '',

          age: demande.age ?? 0,

          email: demande.email ?? '',

          telephone:
            demande.telephone ??
            demande.phone ??
            '',

          gouvernorat:
            demande.gouvernorat ??
            '',

          motivation:
            demande.motivation ??
            demande.reason ??
            '',

          date:
            demande.date ??
            demande.createdAt ??
            demande.updatedAt ??
            '',
        }),
      );
    },

    error: error => {
      console.error(
        'Erreur lors du chargement des demandes :',
        error,
      );

      this.requests = [];
    },
  });
}

  get filteredVolunteers(): Volunteer[] {
    const normalizedQuery = this.query.trim().toLowerCase();

    return this.volunteers.filter(volunteer => {
      const statusMatches =
        this.statusFilter === 'all' ||
        volunteer.status === this.statusFilter;

      if (!statusMatches) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
  volunteer.nom,
  volunteer.prenom,
  volunteer.email,
  volunteer.gouvernorat,
  volunteer.telephone,
]
  .join(' ')
  .toLowerCase()
  .includes(normalizedQuery);
    });
  }

  changeView(view: VolunteerView): void {
    this.view = view;
  }

  toggleStatus(volunteer: Volunteer): void {
  const previousStatus = volunteer.status;

  const newStatus: 'active' | 'inactive' =
    volunteer.status === 'active'
      ? 'inactive'
      : 'active';

  this.volunteerService
    .changeVolunteerStatus(
      String(volunteer.id),
      newStatus,
    )
    .subscribe({
      next: () => {
        volunteer.status = newStatus;
      },

      error: error => {
        console.error(
          'Erreur lors du changement de statut :',
          error,
        );

        volunteer.status = previousStatus;
      },
    });
}

  acceptRequest(request: JoinRequest): void {
  this.demandeService
    .acceptDemande(String(request.id))
    .subscribe({
      next: (response: any) => {
        this.requests = this.requests.filter(
          currentRequest =>
            currentRequest.id !== request.id,
        );

        this.loadVolunteers();

        if (response.emailSent) {
          console.log(
            'Demande acceptée et email envoyé.',
          );
        } else {
          console.warn(
            'Demande acceptée, mais email non envoyé :',
            response.emailError,
          );

          alert(
            "La demande a été acceptée, mais l'email n'a pas pu être envoyé.",
          );
        }
      },

      error: error => {
        console.error(
          "Erreur lors de l'acceptation de la demande :",
          error,
        );

        alert(
          error?.error?.message ||
          "Une erreur est survenue lors de l'acceptation.",
        );
      },
    });
}

  refuseRequest(id: string | number): void {
  this.demandeService
    .rejectDemande(String(id))
    .subscribe({
      next: (response: any) => {
        this.requests = this.requests.filter(
          request => request.id !== id,
        );

        if (response.emailSent) {
          console.log(
            'Demande refusée et email envoyé.',
          );
        } else {
          console.warn(
            'Demande refusée, mais email non envoyé :',
            response.emailError,
          );

          alert(
            "La demande a été refusée, mais l'email n'a pas pu être envoyé.",
          );
        }
      },

      error: error => {
        console.error(
          'Erreur lors du refus de la demande :',
          error,
        );

        alert(
          error?.error?.message ||
          'Une erreur est survenue lors du refus.',
        );
      },
    });
}

  exportXLSX(): void {
    const rows = this.filteredVolunteers.map(volunteer => ({
      Nom: volunteer.nom,
      Prénom: volunteer.prenom,
      Âge: volunteer.age,
      Email: volunteer.email,
      Téléphone: volunteer.telephone,
      Adresse: volunteer.adresse,
      Gouvernorat: volunteer.gouvernorat,
      Statut:
        volunteer.status === 'active'
          ? 'Actif'
          : 'Inactif',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Bénévoles',
    );

    XLSX.writeFile(
      workbook,
      `benevoles-${this.getCurrentDate()}.xlsx`,
    );
  }

  exportPDF(): void {
    const document = new jsPDF({
      orientation: 'landscape',
    });

    document.setFontSize(14);
    document.text(
      'Liste des bénévoles — Tunisia Charity',
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
          'Prénom',
          'Âge',
          'Email',
          'Téléphone',
          'Adresse',
          'Gouvernorat',
          'Statut',
        ],
      ],
      body: this.filteredVolunteers.map(volunteer => [
        volunteer.nom,
        volunteer.prenom,
        String(volunteer.age),
        volunteer.email,
        volunteer.telephone,
        volunteer.adresse,
        volunteer.gouvernorat,
        volunteer.status === 'active'
          ? 'Actif'
          : 'Inactif',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [28, 72, 117],
      },
    });

    document.save(
      `benevoles-${this.getCurrentDate()}.pdf`,
    );
  }

  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  formatRequestDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      'fr-FR',
    );
  }

  getInitials(request: JoinRequest): string {
    return `${request.prenom.charAt(0)}${request.nom.charAt(0)}`;
  }

  trackByVolunteerId(
    _index: number,
    volunteer: Volunteer,
  ): string | number {
    return volunteer.id;
  }

  trackByRequestId(
    _index: number,
    request: JoinRequest,
  ): string | number {
    return request.id;
  }

  trackByStatLabel(
    _index: number,
    stat: StatCard,
  ): string {
    return stat.label;
  }

  private getCurrentDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

