import { Component, OnInit } from '@angular/core';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';

@Component({
  selector: 'app-voir-documents-beneficiaire',
  templateUrl: './voir-documents-beneficiaire.component.html',
  standalone:false,
  styleUrls: ['./voir-documents-beneficiaire.component.css']
})
export class VoirDocumentsBeneficiaireComponent implements OnInit {
  searchText: string = '';
  beneficiaires: any[] = [];

  constructor(private beneficiaryService: BeneficiaryService) {}

  ngOnInit(): void {
    this.fetchBeneficiaires();
  }

  fetchBeneficiaires(): void {
    this.beneficiaryService.getBeneficiaires().subscribe({
      next: (response) => {
        this.beneficiaires = response.data.beneficiaries;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des bénéficiaires:', err);
      }
    });
  }

  get beneficiairesFiltres() {
    return this.beneficiaires.filter(b =>
      (b.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
       b.lastname?.toLowerCase().includes(this.searchText.toLowerCase()))
    );
  }

  // Fonction pour déterminer l'icône à afficher en fonction du type de document
  getIconClass(docKey: string): string {
    if (docKey.toLowerCase().includes('maison')) {
      return 'fas fa-home';  // Icône maison
    } else if (docKey.toLowerCase().includes('photo')) {
      return 'fas fa-camera'; // Icône photo
    }
    return 'fas fa-file-alt'; // Icône par défaut
  }

  downloadBulletin(id: string): void {
  this.beneficiaryService.downloadBulletin(id).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulletin.pdf'; // or set dynamically if you fetch original name
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Erreur lors du téléchargement du bulletin:', err);
    }
  });
}

  
}




