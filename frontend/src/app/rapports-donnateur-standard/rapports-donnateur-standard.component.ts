import { Component, OnInit } from '@angular/core';
import { RapportService } from '../services/rapport/rapport.service';
import { saveAs } from 'file-saver';


interface FileData {
  data: any;
  contentType: string;
  originalName: string;
}
interface Rapport {
  _id: string;
  titre: string;
  type: string;
  date: Date;
  file: FileData;
}


@Component({
  selector: 'app-rapports-donnateur-standard',
  standalone: false,
  templateUrl: './rapports-donnateur-standard.component.html',
  styleUrl: './rapports-donnateur-standard.component.css'
})
export class RapportsDonnateurStandardComponent implements OnInit{
  rapports: Rapport[] = [];
   loading = true;
  errorMessage: string | null = null;
  
  constructor(private rapportService : RapportService) {}
  
  ngOnInit(): void {
    this.loadRapports();
  }

  loadRapports(): void {
    this.loading = true;
    this.errorMessage = null;
    
    this.rapportService.getRapports().subscribe({
      next: (data: any) => {
        this.rapports = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading rapports:', error);
        this.errorMessage = 'Erreur lors du chargement des rapports. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  downloadRapport(rapport: Rapport): void {
      this.rapportService.telechargerRapport(rapport._id).subscribe({
        next: (blob: Blob) => {
          saveAs(blob, rapport.file.originalName);
        },
        error: (error) => {
          console.error('Download error:', error);
          this.errorMessage = 'Erreur lors du téléchargement du rapport.';
        }
      });
    }

}
