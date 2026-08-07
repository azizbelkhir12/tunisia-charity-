import {Component,ElementRef,OnDestroy,OnInit,ViewChild,}from '@angular/core';
import {
  Check,
  CheckCircle2,
  ClockAlert,
  Flag,
  FolderKanban,
  ImagePlus,
  Loader,
  Pencil,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-angular';

import { ProjetService } from '../services/projet/projet.service';
import { Observable } from 'rxjs';

type ProjectStatus =
  | 'en_cours'
  | 'termine'
  | 'en_retard';


type ProjectView = 'ajouter' | 'liste';

type StatusFilter =
  | 'all'
  | ProjectStatus;

interface Project {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  montantSoutenu: number;
  statut: ProjectStatus;
  imageUrl: string;
}


interface ProjectForm {
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  montantSoutenu: number | null;
  statut: ProjectStatus;
}

interface ProjectStats {
  total: number;
  enCours: number;
  termine: number;
  enRetard: number;
  montantTotal: number;
}

interface StatsCard {
  label: string;
  value: string;
  icon: any;
  colorClass: string;
}

@Component({
  selector: 'app-gestion-des-projets',
  templateUrl: './gestion-des-projets.component.html',
  standalone: false,
  styleUrls: ['./gestion-des-projets.component.css']
})
export class GestionDesProjetsComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;



  readonly FolderKanban = FolderKanban;
  readonly Loader = Loader;
  readonly CheckCircle2 = CheckCircle2;
  readonly ClockAlert = ClockAlert;
  readonly Wallet = Wallet;
  readonly Search = Search;
  readonly Check = Check;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Flag = Flag;
  readonly ImagePlus = ImagePlus;
  readonly X = X;

  projects: Project[] = [];

  form: ProjectForm = this.createEmptyForm();

  view: ProjectView = 'ajouter';

  statusFilter: StatusFilter = 'all';

  searchTerm = '';

  editingId: string | null = null;

  selectedImageFile: File | null = null;

  imagePreview = '';

  existingImageUrl = '';

  errors: Record<string, string> = {};

  successMessage: string | null = null;

  errorMessage: string | null = null;

  loading = false;

  saving = false;

  deletingId: string | null = null;

  updatingStatusId: string | null = null;

  private messageTimer?: number;

  readonly statusLabels:
    Record<ProjectStatus, string> = {
      en_cours: 'En cours',
      termine: 'Terminé',
      en_retard: 'En retard',
    };

  constructor(
    private projetService: ProjetService,
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  get stats(): ProjectStats {
    const enCours = this.projects.filter(
      project => project.statut === 'en_cours',
    ).length;

    const termines = this.projects.filter(
      project => project.statut === 'termine',
    ).length;

    const enRetard = this.projects.filter(
      project => project.statut === 'en_retard',
    ).length;

    const montantTotal = this.projects.reduce(
      (total, project) =>
        total +
        Number(project.montantSoutenu || 0),
      0,
    );

    return {
      total: this.projects.length,
      enCours,
      termine: termines,
      enRetard,
      montantTotal,
    };
  }

  get statsCards(): StatsCard[] {
    return [
      {
        label: 'Total projets',
        value: this.formatNumber(
          this.stats.total,
        ),
        icon: this.FolderKanban,
        colorClass: 'primary-icon',
      },
      {
        label: 'En cours',
        value: this.formatNumber(
          this.stats.enCours,
        ),
        icon: this.Loader,
        colorClass: 'warning-icon',
      },
      {
        label: 'Terminés',
        value: this.formatNumber(
          this.stats.termine,
        ),
        icon: this.CheckCircle2,
        colorClass: 'success-icon',
      },
      {
        label: 'En retard',
        value: this.formatNumber(
          this.stats.enRetard,
        ),
        icon: this.ClockAlert,
        colorClass: 'danger-icon',
      },
      {
        label: 'Montant total',
        value:
          `${this.formatNumber(
            this.stats.montantTotal,
          )} TND`,
        icon: this.Wallet,
        colorClass: 'info-icon',
      },
    ];
  }

  get filteredProjects(): Project[] {
    const normalizedSearch =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.projects.filter(project => {
      const matchesStatus =
        this.statusFilter === 'all' ||
        project.statut === this.statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableContent = [
        project.titre,
        project.description,
        project.statut,
      ]
        .join(' ')
        .toLowerCase();

      return searchableContent.includes(
        normalizedSearch,
      );
    });
  }

  loadProjects(): void {
    this.loading = true;
    this.errorMessage = null;

    this.projetService
      .getProjects()
      .subscribe({
        next: response => {
          const backendProjects =
            this.extractProjectList(response);

          this.projects =
            backendProjects.map(
              (project: any) =>
                this.mapBackendProject(project),
            );

          this.loading = false;
        },

        error: error => {
          console.error(
            'Erreur de chargement des projets :',
            error,
          );

          this.projects = [];

          this.errorMessage =
            error?.error?.message ||
            'Impossible de charger les projets.';

          this.loading = false;
        },
      });
  }

  submitProject(): void {
    this.errors = this.validateForm();
    this.errorMessage = null;

    if (
      this.editingId === null &&
      !this.selectedImageFile
    ) {
      this.errors['image'] =
        'L’image du projet est obligatoire.';
    }

    if (
      Object.keys(this.errors).length > 0
    ) {
      return;
    }

    const projectPayload = {
      titre: this.form.titre.trim(),
      description:
        this.form.description.trim(),
      dateDebut: this.form.dateDebut,
      dateFin: this.form.dateFin,
      montantSoutenu: Number(
        this.form.montantSoutenu,
      ),
      statut: this.form.statut,
    };

    this.saving = true;

    if (this.editingId !== null) {
      this.updateExistingProject(
        this.editingId,
        projectPayload,
      );

      return;
    }

    const image = this.selectedImageFile;

    if (!image) {
      this.errors['image'] =
        'L’image du projet est obligatoire.';

      this.saving = false;
      return;
    }

    this.projetService
      .addProject(
        projectPayload,
        image,
      )
      .subscribe({
        next: () => {
          this.saving = false;

          this.resetForm();
          this.view = 'liste';

          this.showSuccessMessage(
            'Le projet a été ajouté avec succès.',
          );

          this.loadProjects();
        },

        error: error => {
          console.error(
            'Erreur lors de l’ajout :',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            'Impossible d’ajouter le projet.';

          this.saving = false;
        },
      });
  }

  editProject(project: Project): void {
    this.editingId = project.id;

    this.form = {
      titre: project.titre,
      description: project.description,
      dateDebut: project.dateDebut,
      dateFin: project.dateFin,
      montantSoutenu: project.montantSoutenu,
      statut: project.statut,
    };

    this.existingImageUrl =
      project.imageUrl;

    this.imagePreview =
      project.imageUrl;

    this.selectedImageFile = null;

    this.errors = {};
    this.errorMessage = null;
    this.view = 'ajouter';

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  deleteProject(project: Project): void {
    const confirmed = window.confirm(
      `Supprimer définitivement le projet « ${project.titre} » ?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingId = project.id;
    this.errorMessage = null;

    this.projetService
      .deleteProject(project.id)
      .subscribe({
        next: () => {
          this.projects =
            this.projects.filter(
              item => item.id !== project.id,
            );

          if (
            this.editingId === project.id
          ) {
            this.resetForm();
          }

          this.deletingId = null;

          this.showSuccessMessage(
            'Le projet a été supprimé avec succès.',
          );
        },

        error: error => {
          console.error(
            'Erreur lors de la suppression :',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            'Impossible de supprimer le projet.';

          this.deletingId = null;
        },
      });
  }

  terminateProject(
    project: Project,
  ): void {
    const confirmed = window.confirm(
      `Marquer le projet « ${project.titre} » comme terminé ?`,
    );

    if (!confirmed) {
      return;
    }

    const projectPayload = {
      titre: project.titre,
      description: project.description,
      dateDebut: project.dateDebut,
      dateFin: project.dateFin,
      montantSoutenu:
        project.montantSoutenu,
      statut: 'termine',
    };

    this.updatingStatusId = project.id;
    this.errorMessage = null;

    this.projetService
      .updateProject(
        project.id,
        projectPayload,
      )
      .subscribe({
        next: () => {
          this.updatingStatusId = null;

          this.showSuccessMessage(
            'Le projet a été marqué comme terminé.',
          );

          this.loadProjects();
        },

        error: error => {
          console.error(
            'Erreur de modification du statut :',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            'Impossible de modifier le statut du projet.';

          this.updatingStatusId = null;
        },
      });
  }

  handleImageSelection(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errors['image'] =
        'Veuillez sélectionner une image valide.';

      input.value = '';
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      this.errors['image'] =
        'L’image ne doit pas dépasser 5 Mo.';

      input.value = '';
      return;
    }

    this.selectedImageFile = file;

    delete this.errors['image'];

    const reader = new FileReader();

    reader.onload = (): void => {
      this.imagePreview =
        String(reader.result);
    };

    reader.onerror = (): void => {
      this.errors['image'] =
        'Impossible de lire cette image.';

      this.selectedImageFile = null;
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  cancelSelectedImage(): void {
    this.selectedImageFile = null;

    this.imagePreview =
      this.editingId !== null
        ? this.existingImageUrl
        : '';

    delete this.errors['image'];

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.form = this.createEmptyForm();

    this.editingId = null;

    this.selectedImageFile = null;

    this.imagePreview = '';

    this.existingImageUrl = '';

    this.errors = {};

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  setView(view: ProjectView): void {
    this.view = view;

    this.errorMessage = null;

    if (
      view === 'ajouter' &&
      this.editingId === null
    ) {
      this.resetForm();
    }
  }

  setStatusFilter(
    filter: StatusFilter,
  ): void {
    this.statusFilter = filter;
  }

  getStatusLabel(
    status: ProjectStatus,
  ): string {
    return this.statusLabels[status];
  }

  formatNumber(value: number): string {
    return Number(value || 0)
      .toLocaleString('fr-FR');
  }

  formatDate(
    dateValue: string,
  ): string {
    if (!dateValue) {
      return '—';
    }

    const normalizedDate =
      this.formatDateForInput(dateValue);

    if (!normalizedDate) {
      return '—';
    }

    const [
      year,
      month,
      day,
    ] = normalizedDate
      .split('-')
      .map(Number);

    const date = new Date(
      year,
      month - 1,
      day,
    );

    return date.toLocaleDateString(
      'fr-FR',
    );
  }

  trackByProjectId(
    index: number,
    project: Project,
  ): string {
    return project.id;
  }

  trackByStatsLabel(
    index: number,
    card: StatsCard,
  ): string {
    return card.label;
  }

  ngOnDestroy(): void {
    if (this.messageTimer) {
      window.clearTimeout(
        this.messageTimer,
      );
    }
  }

  private updateExistingProject(
    id: string,
    projectPayload: any,
  ): void {
    this.projetService
      .updateProject(
        id,
        projectPayload,
        this.selectedImageFile || undefined,
      )
      .subscribe({
        next: () => {
          this.saving = false;

          this.resetForm();
          this.view = 'liste';

          this.showSuccessMessage(
            'Le projet a été modifié avec succès.',
          );

          this.loadProjects();
        },

        error: error => {
          console.error(
            'Erreur lors de la modification :',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            'Impossible de modifier le projet.';

          this.saving = false;
        },
      });
  }

  private extractProjectList(
    response: any,
  ): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (
      Array.isArray(response?.projects)
    ) {
      return response.projects;
    }

    if (
      Array.isArray(response?.projets)
    ) {
      return response.projets;
    }

    if (
      Array.isArray(response?.data)
    ) {
      return response.data;
    }

    if (
      Array.isArray(response?.result)
    ) {
      return response.result;
    }

    return [];
  }

  private mapBackendProject(
    project: any,
  ): Project {
    return {
      id:
        project?._id ??
        project?.id ??
        '',

      titre:
        project?.titre ??
        '',

      description:
        project?.description ??
        '',

      dateDebut:
        this.formatDateForInput(
          project?.dateDebut,
        ),

      dateFin:
        this.formatDateForInput(
          project?.dateFin,
        ),

      montantSoutenu:
        Number(
          project?.montantSoutenu ?? 0,
        ),

      statut:
        this.normalizeStatus(
          project?.statut,
        ),

      imageUrl:
        this.projetService.getImageUrl(
          project?.imageUrl,
        ),
    };
  }

  private normalizeStatus(
    status: string,
  ): ProjectStatus {
    if (
      status === 'termine' ||
      status === 'en_retard'
    ) {
      return status;
    }

    return 'en_cours';
  }

  private formatDateForInput(
    dateValue: string,
  ): string {
    if (!dateValue) {
      return '';
    }

    const value = String(dateValue);

    const datePart = value.match(
      /^\d{4}-\d{2}-\d{2}/,
    );

    if (datePart) {
      return datePart[0];
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date
      .toISOString()
      .slice(0, 10);
  }

  private validateForm():
    Record<string, string> {
    const validationErrors:
      Record<string, string> = {};

    if (!this.form.titre.trim()) {
      validationErrors['titre'] =
        'Le titre est requis.';
    }

    if (
      !this.form.description.trim()
    ) {
      validationErrors['description'] =
        'La description est requise.';
    }

    if (!this.form.dateDebut) {
      validationErrors['dateDebut'] =
        'La date de début est requise.';
    }

    if (!this.form.dateFin) {
      validationErrors['dateFin'] =
        'La date de fin est requise.';
    }

    if (
      this.form.dateDebut &&
      this.form.dateFin &&
      this.form.dateFin <
        this.form.dateDebut
    ) {
      validationErrors['dateFin'] =
        'La date de fin doit être postérieure à la date de début.';
    }

    const montant = Number(
      this.form.montantSoutenu,
    );

    if (
      !this.form.montantSoutenu ||
      Number.isNaN(montant) ||
      montant <= 0
    ) {
      validationErrors['montantSoutenu'] =
        'Le montant doit être supérieur à zéro.';
    }

    return validationErrors;
  }

  private createEmptyForm():
    ProjectForm {
    return {
      titre: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      montantSoutenu: null,
      statut: 'en_cours',
    };
  }

  private showSuccessMessage(
    message: string,
  ): void {
    this.successMessage = message;

    if (this.messageTimer) {
      window.clearTimeout(
        this.messageTimer,
      );
    }

    this.messageTimer =
      window.setTimeout(() => {
        this.successMessage = null;
      }, 3500);
  }
}