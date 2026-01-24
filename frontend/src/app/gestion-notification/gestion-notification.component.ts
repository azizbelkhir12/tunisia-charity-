import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../services/notification/notification.service';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-notification',
  templateUrl: './gestion-notification.component.html',
  standalone:false,
  styleUrls: ['./gestion-notification.component.css'],
})
export class GestionNotificationComponent implements OnInit {
  broadcastType: 'single' | 'group' | 'all' = 'single';
  selectedBeneficiaries: string[] = [];
  isBroadcastMode = false;
  broadcastGroup = '';
  message: string = '';
  beneficiaryGroups: any[] = [];
  notification = {
    idBeneficiaire: '',
    titre: '',
    contenu: ''
  };
  broadcastNotification = {
  titre: '',
  contenu: ''
};

  listeBeneficiaires: any[] = [];
  beneficiairesFiltres: any[] = [];
  recherche: string = '';

  // Statistics
  totalNotifications: number = 0;
  notificationsAujourdhui: number = 0;
  derniereNotification: any = null;

  constructor(
    private notificationService: NotificationService,
    private beneficiaryService: BeneficiaryService
  ) {}

  ngOnInit(): void {
    this.loadBeneficiaries();
    this.loadStatistics();
  }

  loadBeneficiaries(): void {
    this.beneficiaryService.getBeneficiaires().subscribe({
      next: (response: any) => {
        // Handle both direct array and wrapped responses
        console.log('Raw Response:', response);
        this.listeBeneficiaires = Array.isArray(response) 
          ? response 
          : (response.data.beneficiaries || []);
        
        this.beneficiairesFiltres = [...this.listeBeneficiaires];
      },
      error: (err) => {
        console.error('Error loading beneficiaries:', err);
        this.message = '❌ Error loading beneficiaries';
      }
    });
  }

  loadStatistics(): void {
    this.notificationService.getNotificationStats().subscribe({
      next: (response: any) => {
        // Handle both direct and wrapped responses
        const stats = response.data || response;
        this.totalNotifications = stats.totalNotifications || 0;
        this.notificationsAujourdhui = stats.notificationsToday || 0;
        this.derniereNotification = stats.lastNotification || null;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.message = '❌ Error loading statistics';
      }
    });
  }

  filtrerBeneficiaires(): void {
    if (!this.recherche) {
      this.beneficiairesFiltres = [...this.listeBeneficiaires];
      return;
    }
    
    const rechercheLower = this.recherche.toLowerCase();
    this.beneficiairesFiltres = this.listeBeneficiaires.filter(b =>
      (b.name + ' ' + b.lastname).toLowerCase().includes(rechercheLower) ||
      b.email.toLowerCase().includes(rechercheLower)
    );
  }

  envoyerNotification(): void {
  // Find the selected beneficiary
  const selectedBeneficiary = this.listeBeneficiaires.find(
    b => b._id === this.notification.idBeneficiaire
  );

  if (!selectedBeneficiary) {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: 'Bénéficiaire non trouvé',
      timer: 5000,
      timerProgressBar: true
    });
    return;
  }

  // Send the regular notification
  this.notificationService.sendNotification(this.notification).subscribe({
    next: (response) => {
      // After successful notification, send email
      this.notificationService.sendEmailNotification(selectedBeneficiary.email).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Notification et email envoyés avec succès!',
            timer: 5000,
            timerProgressBar: true
          });
          this.loadStatistics();
          this.resetForm();
        },
        error: (emailErr) => {
          console.error('Email error:', emailErr);
          Swal.fire({
            icon: 'warning',
            title: 'Notification envoyée',
            text: 'La notification a été envoyée mais l\'email a échoué',
            timer: 5000,
            timerProgressBar: true
          });
          this.loadStatistics();
          this.resetForm();
        }
      });
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'envoi de la notification',
        timer: 5000,
        timerProgressBar: true
      });
      console.error('Error:', err);
    }
  });
}

  onBroadcastChange(): void {
  if (this.isBroadcastMode) {
    this.notification.idBeneficiaire = ''; // Clear individual selection
  }
}

envoyerBroadcast(): void {
  const data = {
    titre: this.notification.titre,
    contenu: this.notification.contenu
  };

  // Send the broadcast notification
  this.notificationService.broadcastNotification(data).subscribe({
    next: (response) => {
      // After successful broadcast, send emails to all
      this.notificationService.sendEmailNotification('', true).subscribe({
        next: () => {
          const count = response.data?.count || 0;
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: `Notification et emails envoyés à ${count} bénéficiaires`,
            timer: 5000,
            timerProgressBar: true
          });
          this.resetForm();
          this.loadStatistics();
        },
        error: (emailErr) => {
          console.error('Email error:', emailErr);
          Swal.fire({
            icon: 'warning',
            title: 'Notification diffusée',
            text: 'La notification a été diffusée mais les emails ont échoué',
            timer: 5000,
            timerProgressBar: true
          });
          this.resetForm();
          this.loadStatistics();
        }
      });
    },
    error: (err) => {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la diffusion',
        timer: 5000,
        timerProgressBar: true
      });
    }
  });
}

   private showSuccess(msg: string): void {
    this.message = `✅ ${msg}`;
    setTimeout(() => this.message = '', 5000);
  }

  toggleBeneficiary(id: string, event: any): void {
  if (event.target.checked) {
    this.selectedBeneficiaries.push(id);
  } else {
    this.selectedBeneficiaries = this.selectedBeneficiaries.filter(b => b !== id);
  }
}

envoyerGroupe(): void {
  if (this.selectedBeneficiaries.length === 0) {
    Swal.fire('Erreur', 'Aucun bénéficiaire sélectionné', 'error');
    return;
  }

  const requests = this.selectedBeneficiaries.map(id => {
    return this.notificationService.sendNotification({
      idBeneficiaire: id,
      titre: this.notification.titre,
      contenu: this.notification.contenu
    });
  });

  Promise.all(requests.map(r => r.toPromise()))
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Notification envoyée au groupe',
        timer: 4000
      });
      this.resetForm();
      this.loadStatistics();
    })
    .catch(err => {
      console.error(err);
      Swal.fire('Erreur', 'Erreur lors de l’envoi au groupe', 'error');
    });
}



  private showError(msg: string): void {
    this.message = `❌ ${msg}`;
    console.error(msg);
  }

  resetForm(): void {
    this.notification = {
      idBeneficiaire: '',
      titre: '',
      contenu: ''
    };
    this.recherche = '';
    this.beneficiairesFiltres = [...this.listeBeneficiaires];
  }
}

