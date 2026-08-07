import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';

import {
  BarChart3,
  BookOpen,
  Check,
  Download,
  Eye,
  FileText,
  Search,
  Trash2,
  Upload,
} from 'lucide-angular';

import { RapportService } from '../services/rapport/rapport.service';

type ReportType = 'financier' | 'litteraire';
type ViewMode = 'ajouter' | 'liste';
type ReportFilter = 'all' | ReportType;

interface RapportFile {
  data?: unknown;
  contentType?: string;
  originalName?: string;
}

interface Rapport {
  _id?: string;
  id?: string;
  titre: string;
  type: ReportType;
  file?: RapportFile;
  date: string | Date;
}

interface FormErrors {
  titre?: string;
  file?: string;
}
@Component({
  selector: 'app-gestion-des-rapports',
  templateUrl: './gestion-des-rapports.component.html',
  standalone: false,
  styleUrls: ['./gestion-des-rapports.component.css']
})
export class GestionDesRapportsComponent implements OnInit {
  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  // Lucide icons
  readonly FileTextIcon = FileText;
  readonly BarChart3Icon = BarChart3;
  readonly BookOpenIcon = BookOpen;
  readonly SearchIcon = Search;
  readonly CheckIcon = Check;
  readonly Trash2Icon = Trash2;
  readonly EyeIcon = Eye;
  readonly DownloadIcon = Download;
  readonly UploadIcon = Upload;

  reports: Rapport[] = [];

  view: ViewMode = 'ajouter';

  titre = '';
  type: ReportType = 'financier';
  selectedFile: File | null = null;

  searchQuery = '';
  typeFilter: ReportFilter = 'all';

  errors: FormErrors = {};

  loading = false;
  saving = false;
  saved = false;

  deletingId: string | null = null;
  downloadingId: string | null = null;
  consultingId: string | null = null;

  errorMessage = '';

  private successTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private rapportService: RapportService,
  ) {}

  ngOnInit(): void {
    this.loadRapports();
  }

  get totalReports(): number {
    return this.reports.length;
  }

  get totalFinancialReports(): number {
    return this.reports.filter(
      (report) => report.type === 'financier',
    ).length;
  }

  get totalLiteraryReports(): number {
    return this.reports.filter(
      (report) => report.type === 'litteraire',
    ).length;
  }

  get filteredReports(): Rapport[] {
    const term = this.searchQuery.trim().toLowerCase();

    return this.reports.filter((report) => {
      const matchesType =
        this.typeFilter === 'all' ||
        report.type === this.typeFilter;

      if (!matchesType) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchableText = [
        report.titre,
        report.type,
        this.getTypeLabel(report.type),
        report.file?.originalName ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  }

  loadRapports(): void {
    this.loading = true;
    this.errorMessage = '';

    this.rapportService.getRapports().subscribe({
      next: (response: any) => {
        /*
         * Cette partie accepte plusieurs formats de réponse :
         *
         * 1. [rapport1, rapport2]
         * 2. { rapports: [...] }
         * 3. { data: [...] }
         */
        if (Array.isArray(response)) {
          this.reports = response;
        } else if (Array.isArray(response?.rapports)) {
          this.reports = response.rapports;
        } else if (Array.isArray(response?.data)) {
          this.reports = response.data;
        } else {
          this.reports = [];
        }

        this.loading = false;
      },
      error: (error) => {
        console.error(
          'Erreur pendant le chargement des rapports :',
          error,
        );

        this.errorMessage =
          error?.error?.message ||
          'Impossible de charger les rapports.';

        this.loading = false;
      },
    });
  }

  changeView(view: ViewMode): void {
    this.view = view;
    this.errorMessage = '';
  }

  setTypeFilter(filter: ReportFilter): void {
    this.typeFilter = filter;
  }

  onTitleChange(): void {
    if (this.titre.trim()) {
      delete this.errors.titre;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.errorMessage = '';

    if (!file) {
      this.selectedFile = null;
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const allowedExtensions = ['pdf', 'doc', 'docx'];

    const extension =
      file.name.split('.').pop()?.toLowerCase() ?? '';

    const validType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(extension);

    if (!validType) {
      this.selectedFile = null;

      this.errors.file =
        'Seuls les fichiers PDF, DOC et DOCX sont autorisés.';

      input.value = '';
      return;
    }

    this.selectedFile = file;
    delete this.errors.file;
  }

  submitReport(): void {
    this.errorMessage = '';

    const formErrors: FormErrors = {};

    if (!this.titre.trim()) {
      formErrors.titre =
        'Le titre du rapport est requis.';
    }

    if (!this.selectedFile) {
      formErrors.file =
        'Veuillez choisir un fichier.';
    }

    this.errors = formErrors;

    if (
      Object.keys(formErrors).length > 0 ||
      !this.selectedFile
    ) {
      return;
    }

    const formData = new FormData();

    formData.append(
      'titre',
      this.titre.trim(),
    );

    formData.append(
      'type',
      this.type,
    );

    
    formData.append(
      'file',
      this.selectedFile,
      this.selectedFile.name,
    );

    this.saving = true;

    this.rapportService.ajouterRapport(formData).subscribe({
      next: (response: any) => {
        const createdReport =
          response?.rapport ??
          response?.data ??
          response;

        /*
         * Si le backend renvoie directement le rapport créé,
         * on l'ajoute immédiatement.
         * Sinon, on recharge la liste.
         */
        if (
          createdReport &&
          createdReport.titre &&
          createdReport.type
        ) {
          this.reports = [
            createdReport,
            ...this.reports,
          ];
        } else {
          this.loadRapports();
        }

        this.resetForm();
        this.showSuccessMessage();

        this.view = 'liste';
        this.saving = false;
      },
      error: (error) => {
        console.error(
          'Erreur pendant l’ajout du rapport :',
          error,
        );

        this.errorMessage =
          error?.error?.message ||
          'Impossible d’ajouter le rapport.';

        this.saving = false;
      },
    });
  }

  removeReport(report: Rapport): void {
    const id = this.getReportId(report);

    if (!id) {
      this.errorMessage =
        'Identifiant du rapport introuvable.';
      return;
    }

    const confirmed = window.confirm(
      `Supprimer définitivement le rapport "${report.titre}" ?`,
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.deletingId = id;

    this.rapportService.supprimerRapport(id).subscribe({
      next: () => {
        this.reports = this.reports.filter(
          (currentReport) =>
            this.getReportId(currentReport) !== id,
        );

        this.deletingId = null;
      },
      error: (error) => {
        console.error(
          'Erreur pendant la suppression du rapport :',
          error,
        );

        this.errorMessage =
          error?.error?.message ||
          'Impossible de supprimer le rapport.';

        this.deletingId = null;
      },
    });
  }

  downloadReport(report: Rapport): void {
    const id = this.getReportId(report);

    if (!id) {
      this.errorMessage =
        'Identifiant du rapport introuvable.';
      return;
    }

    this.errorMessage = '';
    this.downloadingId = id;

    this.rapportService
      .telechargerRapport(id)
      .subscribe({
        next: (blob: Blob) => {
          const fileName =
            report.file?.originalName ||
            `rapport-${id}`;

          const objectUrl =
            URL.createObjectURL(blob);

          const anchor =
            document.createElement('a');

          anchor.href = objectUrl;
          anchor.download = fileName;

          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);

          URL.revokeObjectURL(objectUrl);

          this.downloadingId = null;
        },
        error: (error) => {
          console.error(
            'Erreur pendant le téléchargement :',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            'Impossible de télécharger le rapport.';

          this.downloadingId = null;
        },
      });
  }

  consultReport(report: Rapport): void {
    const id = this.getReportId(report);

    if (!id) {
      this.errorMessage =
        'Identifiant du rapport introuvable.';
      return;
    }

    this.errorMessage = '';
    this.consultingId = id;

    const previewWindow = window.open(
      '',
      '_blank',
    );

    this.rapportService
      .consulterRapport(id)
      .subscribe({
        next: (blob: Blob) => {
          const contentType =
            blob.type ||
            report.file?.contentType ||
            'application/octet-stream';

          const previewBlob = new Blob(
            [blob],
            { type: contentType },
          );

          const objectUrl =
            URL.createObjectURL(previewBlob);

          if (previewWindow) {
            previewWindow.location.href = objectUrl;
          } else {
            window.open(
              objectUrl,
              '_blank',
              'noopener,noreferrer',
            );
          }

          /*
           * On laisse suffisamment de temps au navigateur
           * pour charger le document.
           */
          window.setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
          }, 60000);

          this.consultingId = null;
        },
        error: (error) => {
          console.error(
            'Erreur pendant la consultation :',
            error,
          );

          if (previewWindow) {
            previewWindow.close();
          }

          this.errorMessage =
            error?.error?.message ||
            'Impossible de consulter le rapport.';

          this.consultingId = null;
        },
      });
  }

  getReportId(report: Rapport): string {
    return report._id ?? report.id ?? '';
  }

  getTypeLabel(type: ReportType): string {
    return type === 'financier'
      ? 'Financier'
      : 'Littéraire';
  }

  trackByReportId(
  index: number,
  report: Rapport,
): string | number {
  return report._id || report.id || index;
}
  private resetForm(): void {
    this.titre = '';
    this.type = 'financier';
    this.selectedFile = null;
    this.errors = {};

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private showSuccessMessage(): void {
    this.saved = true;

    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }

    this.successTimeout = setTimeout(() => {
      this.saved = false;
    }, 3500);
  }
}
