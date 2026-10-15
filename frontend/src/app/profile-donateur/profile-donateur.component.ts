import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AuthService } from '../services/auth/auth.service';
import { DonorsService } from '../services/donors/donors.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-donateur',
  standalone: false,
  templateUrl: './profile-donateur.component.html',
  styleUrl: './profile-donateur.component.css'
})
export class ProfileDonateurComponent {


  utilisateur: any = {};
  profileForm!: FormGroup;
  showSaveButton: boolean = false;


  gouvernorats: string[] = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès',
    'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili',
    'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir',
    'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
    'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
  ];

  isEditing: { [key: string]: boolean } = {
    name: false,
    lastname: false,
    email: false,
    phoneNumber: false,
    gouvernorat: false,
    Age: false,
    address: false
  };

  constructor(
    private authService: AuthService,
    private donorService: DonorsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDonorData();
  }

  initializeForm(): void {
    this.profileForm = this.fb.group({
      name: [''],
      lastname: [''],
      email: [''],
      phoneNumber: [''],
      gouvernorat: [''],
      Age: [''],
      address: ['']
    });
  }

  loadDonorData(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.donorService.getDonorsById(userId).subscribe({
        next: (donor) => {
          this.utilisateur = donor;
          // Patch the form with the utilisateur data
          this.profileForm.patchValue({
            name: donor.name || '',
            lastname: donor.lastname || '',
            email: donor.email || '',
            phoneNumber: donor.phone || '',
            gouvernorat: donor.gouvernorat || '',
            Age: donor.Age || '',
            address: donor.address || ''
          });
        },
        error: (error) => {
          console.error('Erreur lors du chargement du donateur :', error);
        }
      });
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('img', file);

      const userId = this.authService.getCurrentUserId();
      if (userId) {
        this.donorService.updateDonor(userId, formData).subscribe({
          next: (res) => {
           
            this.utilisateur.img = res.donor.img; // Access the img from res.donor
            // Force UI refresh if needed
            this.utilisateur = { ...this.utilisateur };

            // Show success confirmation
            Swal.fire({
              icon: 'success',
              title: 'Image Updated',
              text: 'Your profile image has been successfully updated!'
            });
          },
          error: (err) => {
            console.error('Error uploading image:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'There was an error uploading your image. Please try again.'
            });
          }
        });
      }
    }
  }

  saveAllFields(): void {
    const updatedData = this.profileForm.value;
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.donorService.updateDonor(userId, updatedData).subscribe({
        next: (res) => {
          this.utilisateur = { ...this.utilisateur, ...updatedData };
          for (const key in this.isEditing) {
            this.isEditing[key] = false;
          }

          // Show success confirmation
          Swal.fire({
            icon: 'success',
            title: 'Profile Updated',
            text: 'Votre profil est mis à jour avec succès !'
          });
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'There was an error updating your profile. Please try again.'
          });
        }
      });
    }
  }

  modifierChamp(champ: string): void {
    this.isEditing[champ] = true;
  }

  enableAllEditing() {
    for (const key in this.isEditing) {
      if (this.isEditing.hasOwnProperty(key)) {
        this.isEditing[key] = true;
      }
    }
    // Ensure the form is populated with the current utilisateur data
    const [name, lastname] = (this.utilisateur.name || '').split(' ', 2);
    this.profileForm.patchValue({
      name: name || '',
      lastname: lastname || this.utilisateur.lastname || '',
      email: this.utilisateur.email || '',
      phoneNumber: this.utilisateur.phone || '',
      gouvernorat: this.utilisateur.gouvernorat || '',
      Age: this.utilisateur.Age || '',
      address: this.utilisateur.address || ''
    });
    this.showSaveButton = true;
  }
}
