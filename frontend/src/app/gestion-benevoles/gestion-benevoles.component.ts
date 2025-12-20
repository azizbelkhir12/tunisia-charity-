import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DemandeService } from '../services/demande/demande.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import Swal from 'sweetalert2';

import { jsPDF } from 'jspdf';  // Import jsPDF
import * as XLSX from 'xlsx';

interface Benevole {
[x: string]: any;
lastName: any;
phone: any;
address: any;
name: any;
lastname: any;
adresse: any;
statut: any;
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  telephone?: string;
  age: number;
  gouvernorat: string;
  status: 'active' | 'inactive';
}


@Component({
  selector: 'app-gestion-benevoles',
  templateUrl: './gestion-benevoles.component.html',
  standalone: false,
  styleUrls: ['./gestion-benevoles.component.css']
})
export class GestionBenevolesComponent implements OnInit {

  benevoles: Benevole[] = [];
  volunteers: any[] = [];
  demandesBenevolat: any[] = [];
  selectedVolunteer: any = null;
  isEditModalOpen = false;


  totalBenevoles = this.volunteers.length;
  totalBenevolesActifs = 0;
  totalBenevolesInactifs = 0;

  isLoading = false;

  searchTerm: string = '';
  searchTermTelephone: string = '';
  selectedAge: any = null;
  selectedStatut: string = '';
  selectedGouvernorat: string = '';

  gouvernorats: string[] = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan',
    'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'Manouba', 'Medenine', 'Monastir', 'Nabeul',
    'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  formulaireActif: string = 'listeBenevoles';

  nouveauBenevole: any = {
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    age: 0,
    gouvernorat: '',
    statut: 'actif'
  };
benevole: any;

  constructor(private volunteerService: VolunteerService, private snackBar: MatSnackBar, private demandeService: DemandeService) { }

  ngOnInit(): void {
    this.loadDemandes();
    this.fetchVolunteers();
  }

  afficherFormulaire(type: string) {
    this.formulaireActif = type;
  }

  private updateStatistics(): void {
    this.totalBenevoles = this.volunteers.length;
    this.totalBenevolesActifs = this.volunteers.filter(v => v.status === 'active').length;
    this.totalBenevolesInactifs = this.volunteers.filter(v => v.status === 'inactive').length;
  }

  getFilteredBenevoles(): Benevole[] {
    return this.benevoles.filter(b => {
      const correspondName = this.searchTerm ? b.name.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;
      const correspondAge = this.selectedAge ? b.age === this.selectedAge : true;
      const correspondGouvernorat = this.selectedGouvernorat ? b.gouvernorat === this.selectedGouvernorat : true;
      const correspondStatut = this.selectedStatut
      ? b.status?.toLowerCase() === this.selectedStatut.toLowerCase()
      : true;

      const correspondphone = this.searchTermTelephone
      ? b.phone?.replace(/\D/g, '').includes(this.searchTermTelephone.replace(/\D/g, ''))
      : true;


      return correspondName && correspondAge && correspondGouvernorat && correspondStatut && correspondphone;
    });
  }



  getFilteredDemandes() {
    const normalizedSearchTerm = this.searchTerm.toLowerCase();
    const normalizedSearchTermTelephone = this.searchTermTelephone.replace(/\D/g, '');

    return this.demandesBenevolat.filter(d =>
      d.nom.toLowerCase().includes(normalizedSearchTerm) &&
      (this.selectedGouvernorat ? d.gouvernorat === this.selectedGouvernorat : true) &&
      (normalizedSearchTermTelephone ? d.telephone.replace(/\D/g, '').includes(normalizedSearchTermTelephone) : true)
    );
  }
  exportbenevolesToXLSX() {
    if (!this.benevoles || this.benevoles.length === 0) {
      alert('Aucun bénévole à exporter.');
      return;
    }

    // On peut éventuellement filtrer ou transformer les données ici
    const data = this.benevoles.map(b => ({
      Nom: b.name || 'Non précisé',
      Prénom: b.lastName || 'Non précisé',
      Email: b.email || 'Non précisé',
      Âge: b.age !== undefined ? b.age : 'Non précisé',
      Gouvernorat: b.gouvernorat || 'Non précisé',
      Téléphone: b.phone || 'Non précisé',
      Statut: b.status || 'Non précisé'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = { Sheets: { 'Bénévoles': ws }, SheetNames: ['Bénévoles'] };
    XLSX.writeFile(wb, 'liste_benevoles.xlsx');
  }


  exportToXLSX() {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.demandesBenevolat);
    const wb: XLSX.WorkBook = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    XLSX.writeFile(wb, 'demandes_benevolat.xlsx');
  }

  exportToPDF() {
    if (!this.demandesBenevolat || this.demandesBenevolat.length === 0) {
      alert('Aucune demande à exporter.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(12);
    let y = 20;

    doc.text('Liste des demandes de bénévolat', 20, y);
    y += 10;

    this.demandesBenevolat.forEach((demande, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const nom = demande.name || 'Non précisé';
      const prenom = demande.prenom || 'Non précisé';
      const email = demande.email || 'Non précisé';
      const age = demande.age !== undefined ? demande.age : 'Non précisé';
      const gouvernorat = demande.gouvernorat || 'Non précisé';
      const telephone = demande.phone || 'Non précisé';
      const raison = demande.reason || 'Non précisée';

      doc.text(`Nom : ${nom}`, 20, y);
      y += 8;
      doc.text(`Prénom : ${prenom}`, 20, y);
      y += 8;
      doc.text(`Email : ${email}`, 20, y);
      y += 8;
      doc.text(`Âge : ${age}`, 20, y);
      y += 8;
      doc.text(`Gouvernorat : ${gouvernorat}`, 20, y);
      y += 8;
      doc.text(`Téléphone : ${telephone}`, 20, y);
      y += 8;
      doc.text(`Raison : ${raison}`, 20, y);
      y += 10;

      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(20, y, 190, y);
      y += 10;
    });

    doc.save('demandes_benevolat.pdf');
  }



  loadDemandes(): void {
    this.isLoading = true;
    this.demandeService.getAllDemandes().subscribe({
      next: (demandes: any) => {
        this.demandesBenevolat = demandes;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading demandes', err);
        this.isLoading = false;
        alert('Erreur lors du chargement des demandes');
      }
    });
  }
  exportBenevolesToPDF() {
    if (!this.benevoles || this.benevoles.length === 0) {
      alert('Aucun bénévole à exporter.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(12);
    let y = 20;

    doc.text('Liste des bénévoles', 20, y);
    y += 10;

    this.benevoles.forEach((benevole, index) => {
      // Ajouter une nouvelle page si nécessaire
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const nom = benevole.name || 'Non précisé';
      const prenom = benevole.lastName || 'Non précisé';
      const email = benevole.email || 'Non précisé';
      const age = benevole.age !== undefined ? benevole.age : 'Non précisé';
      const gouvernorat = benevole.gouvernorat || 'Non précisé';
      const telephone = benevole.phone || 'Non précisé';
      const statut = benevole.status || 'Non précisé';

      // Affichage bien espacé
      doc.text(`Nom : ${nom}`, 20, y);
      y += 8;
      doc.text(`Prénom : ${prenom}`, 20, y);
      y += 8;
      doc.text(`Email : ${email}`, 20, y);
      y += 8;
      doc.text(`Âge : ${age}`, 20, y);
      y += 8;
      doc.text(`Gouvernorat : ${gouvernorat}`, 20, y);
      y += 8;
      doc.text(`Téléphone : ${telephone}`, 20, y);
      y += 8;
      doc.text(`Statut : ${statut}`, 20, y);
      y += 10;

      // Ligne de séparation discrète
      doc.setDrawColor(200); // gris clair
      doc.line(20, y, 190, y);
      y += 10;
    });

    doc.save('liste_benevoles.pdf');
  }


  

accepterDemande(demande: { _id: string }): void {
  Swal.fire({
    title: 'Êtes-vous sûr(e)?',
    text: 'Voulez-vous vraiment accepter cette demande ?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, accepter!',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      this.demandeService.acceptDemande(demande._id).subscribe({
        next: () => {
          this.loadDemandes();
          Swal.fire('Acceptée!', 'Demande acceptée avec succès!', 'success');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error accepting demande', err);
          Swal.fire('Erreur', 'Erreur lors de l\'acceptation de la demande', 'error');
          this.isLoading = false;
        }
      });
    }
  });
}




refuserDemande(demande: any): void {
  if (!demande || !demande._id) {
    console.error('Invalid demande object or missing _id');
    return;
  }

  Swal.fire({
    title: 'Êtes-vous sûr(e)?',
    text: `Voulez-vous vraiment refuser la demande de ${demande.nom} ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, refuser!',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      this.demandeService.rejectDemande(demande._id).subscribe({
        next: () => {
          this.demandesBenevolat = this.demandesBenevolat.filter(d => d._id !== demande._id);
          this.isLoading = false;
          Swal.fire('Refusée!', 'Demande refusée avec succès', 'success');
        },
        error: (err) => {
          console.error('Error rejecting demande:', err);
          this.isLoading = false;
          Swal.fire('Erreur', 'Erreur lors du refus de la demande', 'error');
        }
      });
    }
  });
}


activateVolunteer(volunteer: Benevole) {
  if (!volunteer?._id) {
    console.error('Invalid volunteer or missing ID', volunteer);
    return;
  }

  Swal.fire({
    title: 'Êtes-vous sûr(e)?',
    text: `Activer le bénévole  ?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Oui, activer!',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.changeStatus(String(volunteer._id), 'active');
    }
  });
}

deactivateVolunteer(volunteer: Benevole) {
  if (!volunteer?._id) {
    console.error('Invalid volunteer or missing ID', volunteer);
    return;
  }

  Swal.fire({
    title: 'Êtes-vous sûr(e)?',
    text: `Désactiver le bénévole  ?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Oui, désactiver!',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.changeStatus(String(volunteer._id), 'inactive');
    }
  });
}


  private changeStatus(volunteerId: string, newStatus: 'active' | 'inactive') {
    this.isLoading = true;
    this.volunteerService.changeVolunteerStatus(volunteerId, newStatus).subscribe({
      next: (updatedVolunteer) => {
        const index = this.volunteers.findIndex(v => v._id === volunteerId);
        if (index !== -1) {
          this.volunteers[index].status = newStatus;
        }
        this.updateStatistics();
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Statut mis à jour avec succès`,
          timer: 2000,
          showConfirmButton: false
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error changing status:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de la mise à jour du statut',
          timer: 3000,
          showConfirmButton: false
        });
        this.isLoading = false;
      }
    });
  }

  openEditModal(benevole: Benevole) {
  this.selectedVolunteer = { ...benevole }; // clone pour éviter effet direct
  this.isEditModalOpen = true;
}

closeEditModal() {
  this.isEditModalOpen = false;
  this.selectedVolunteer = null;
}

updateVolunteer() {
  if (!this.selectedVolunteer?._id) {
    Swal.fire('Erreur', 'ID du bénévole manquant', 'error');
    return;
  }

  this.isLoading = true;

  this.volunteerService.updateVolunteerByAdmin(this.selectedVolunteer._id, this.selectedVolunteer).subscribe({
      next: () => {
        this.isLoading = false;
        this.closeEditModal();
        this.fetchVolunteers(); // refresh table

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Bénévole modifié avec succès',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire(
          'Erreur',
          err.error?.message || 'Erreur lors de la modification',
          'error'
        );
      }
    });
}


  fetchVolunteers() {
    this.volunteerService.getVolunteers().subscribe(
      (data: any[]) => {
        this.volunteers = data;
        this.benevoles = data; 
        this.updateStatistics(); 
      },
      (error) => {
        console.error('Error fetching volunteers:', error);
      }
    );
  }
}

