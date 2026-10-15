import { Component } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { DonorsService } from '../services/donors/donors.service';

@Component({
  selector: 'app-historique-paiement',
  standalone: false,
  templateUrl: './historique-paiement.component.html',
  styleUrl: './historique-paiement.component.css'
})
export class HistoriquePaiementComponent {
  filtreStatut: string = '';
  recherche: string = '';
  paiements: any[] = [];

  constructor(
    private donorsService: DonorsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDonations();
  }

  loadDonations(): void {
    const donorId = this.authService.getCurrentUserId();
    
    if (!donorId) {
      console.error('No donor ID found - user might not be logged in');
      return;
    }
  
    this.donorsService.getDonationsByDonorId(donorId).subscribe({
      next: (response) => {
        
        // Check if response has donations array
        if (response.success && Array.isArray(response.donations)) {
          this.paiements = response.donations.map(donation => ({
            date: new Date(donation.createdAt).toLocaleDateString('fr-FR'),
            amount: donation.amount,
            paymentMethod: this.translatePaymentMethod(donation.paymentMethod),
            status: this.translateStatus(donation.status),
            receiptUrl: donation.paymentDetails?.receipt_url || undefined
          }));
        } else {
          console.warn('Unexpected API response structure:', response);
          this.paiements = [];
        }
      },
      error: (err) => {
        console.error('Error loading donations:', err);
        this.paiements = [];
      }
    });
  }

  private translatePaymentMethod(method: string): string {
    const methods: {[key: string]: string} = {
      'credit_card': 'Carte de crédit',
      'paypal': 'PayPal',
      'bank_transfer': 'Virement bancaire'
    };
    return methods[method] || method;
  }

  private translateStatus(status: string): string {
    const statusMap: {[key: string]: string} = {
      'completed': 'réussi',
      'pending': 'en attente',
      'failed': 'échoué'
    };
    return statusMap[status] || status;
  }


  get paiementsFiltres() {
    return this.paiements.filter(p =>
      (this.filtreStatut === '' || p.statut === this.filtreStatut) &&
      (this.recherche === '' || p.moyen.toLowerCase().includes(this.recherche.toLowerCase()))
    );
  }
}


