import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RapportService } from '../services/rapport/rapport.service';

import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Heart,
} from 'lucide-angular';

type ReportType = 'financier' | 'litteraire';
type ReportFilter = 'tous' | ReportType;

interface Report {
  id: string;
  titre: string;
  year: string;
  type: ReportType;
  description: string;
  pages: number;
  size: string;
  file: string;
}

@Component({
  selector: 'app-rapports',
  standalone: false,
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.css'
})
export class RapportsComponent implements OnInit {
    readonly currentYear = new Date().getFullYear();

  readonly icons = {
    arrowLeft: ArrowLeft,
    barChart: BarChart3,
    bookOpen: BookOpen,
    calendar: Calendar,
    download: Download,
    eye: Eye,
    fileText: FileText,
    heart: Heart,
  };

  filter: ReportFilter = 'tous';

   readonly filters = [
    {
      key: 'tous' as const,
      label: 'Tous les rapports',
      icon: FileText,
    },
    {
      key: 'financier' as const,
      label: 'Financiers',
      icon: BarChart3,
    },
    {
      key: 'litteraire' as const,
      label: 'Littéraires',
      icon: BookOpen,
    },
  ];

  reports: Report[] = [];

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private  rapportService: RapportService
  ) {}

  ngOnInit(): void {
    this.initializeMetaTags();
    this.getRapports();
  }

  private initializeMetaTags(): void {
    this.titleService.setTitle('Rapports — Tunisia Charity');

    this.metaService.updateTag({
      name: 'description',
      content:
        'Consultez et téléchargez les rapports financiers et littéraires annuels de Tunisia Charity en toute transparence.',
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: 'Rapports — Tunisia Charity',
    });

    this.metaService.updateTag({
      property: 'og:description',
      content:
        'Transparence et redevabilité : nos rapports financiers et littéraires à télécharger.',
    });
  }

  getRapports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rapportService.getRapports().subscribe({
      next: (response: any) => {
      
        if (Array.isArray(response)) {
          this.reports = response;
        }
        else {
          this.reports = [];
        }

        this.isLoading = false;
      },

      error: (error) => {
        console.error('Error loading reports:', error);

        this.reports = [];
        this.errorMessage =
          'Une erreur est survenue lors du chargement des rapports.';
        this.isLoading = false;
      },
    });
  }

  onTelechargerRapport(report: Report): void {
  this.rapportService.telechargerRapport(report.id).subscribe({
    next: (blob: Blob) => {
      const pdfBlob = new Blob([blob], {
        type: 'application/pdf',
      });

      const fileUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = this.getPdfFileName(report.titre);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(fileUrl);
    },

    error: (error) => {
      console.error(
        'Erreur lors du téléchargement du rapport :',
        error
      );

      this.errorMessage =
        'Impossible de télécharger ce rapport.';
    },
  });
}

onConsulterRapport(report: Report): void {
  // Ouvrir immédiatement l’onglet pour éviter le blocage des pop-ups
  const previewWindow = window.open('', '_blank');

  if (previewWindow) {
    previewWindow.document.title = 'Chargement du rapport';
    previewWindow.document.body.innerHTML = `
      <p style="
        font-family: Arial, sans-serif;
        text-align: center;
        margin-top: 40px;
        color: #5a5a5a;
      ">
        Chargement du rapport...
      </p>
    `;
  }

  this.rapportService.consulterRapport(report.id).subscribe({
    next: (blob: Blob) => {
      const pdfBlob = new Blob([blob], {
        type: 'application/pdf',
      });

      const fileUrl = URL.createObjectURL(pdfBlob);

      if (previewWindow) {
        previewWindow.location.href = fileUrl;
      } else {
        window.open(fileUrl, '_blank');
      }

      // Laisser suffisamment de temps au navigateur pour charger le PDF
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 300000);
    },

    error: (error) => {
      console.error(
        'Erreur lors de la consultation du rapport :',
        error
      );

      previewWindow?.close();

      this.errorMessage =
        'Impossible de consulter ce rapport.';
    },
  });
}

private getPdfFileName(title: string): string {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalizedTitle || 'rapport'}.pdf`;
}



  get filteredReports(): Report[] {
    if (this.filter === 'tous') {
      return this.reports;
    }

    return this.reports.filter((report) => report.type === this.filter);
  }

  setFilter(filter: ReportFilter): void {
    this.filter = filter;
  }

  isFinancial(report: Report): boolean {
    return report.type === 'financier';
  }

  getReportIcon(report: Report) {
    return this.isFinancial(report) ? BarChart3 : BookOpen;
  }

  getReportBadge(report: Report): string {
    return this.isFinancial(report) ? 'Financier' : 'Littéraire';
  }

  trackByReportId(_index: number, report: Report): string {
    return report.id;
  }
  
}
