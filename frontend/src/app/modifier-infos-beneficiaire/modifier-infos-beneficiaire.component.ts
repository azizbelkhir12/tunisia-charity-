import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../services/auth/auth.service';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';


@Component({
  selector: 'app-modifier-infos-beneficiaire',
  templateUrl: './modifier-infos-beneficiaire.component.html',
  standalone:false,
  styleUrls: ['./modifier-infos-beneficiaire.component.css']
})
export class ModifierInfosBeneficiaireComponent implements OnInit {
  utilisateur: any = {};
  profileForm!: FormGroup;

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
    private beneficiaryService: BeneficiaryService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadBeneficiaryData();
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

  loadBeneficiaryData(): void {
    const id = this.authService.getCurrentUserId();
    if (!id) {
      console.error('No user ID found');
      return;
    }

    this.beneficiaryService.getBeneficiaireById(id).subscribe({
      next: (data) => {
        const beneficiary = data.data.beneficiary;
        this.utilisateur = beneficiary;
        this.profileForm.patchValue({
          name: beneficiary.name || '',
          lastname: beneficiary.lastname || '',
          email: beneficiary.email || '',
          phoneNumber: beneficiary.phoneNumber || '',
          gouvernorat: beneficiary.gouvernorat || '',
          Age: beneficiary.Age || '',
          address: beneficiary.address || ''
        });
      },
      error: (err) => {
        console.error('Error loading beneficiary data:', err);
      }
    });
  }

  modifierChamp(champ: string): void {
    this.isEditing[champ] = true;
  }

  saveField(champ: string): void {
    const id = this.authService.getCurrentUserId();
    const value = this.profileForm.get(champ)?.value;

    if (!id || value === undefined) return;

    this.beneficiaryService.updateBeneficiaire(id, { [champ]: value }).subscribe({
      next: () => {
        this.utilisateur[champ] = value;
        this.isEditing[champ] = false;
      },
      error: (err) => {
        console.error(`Error updating ${champ}:`, err);
      }
    });
  }

  resetForm(): void {
    this.profileForm.patchValue(this.utilisateur);
    Object.keys(this.isEditing).forEach(key => this.isEditing[key] = false);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
  
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result as string;
  
        this.beneficiaryService.uploadPhoto(this.utilisateur._id, file).subscribe({
          next: (res) => {
            this.utilisateur.photoUrl = base64Image;
          },
          error: (err) => {
            console.error('Photo upload failed:', err);
          }
        });
      };
  
      reader.readAsDataURL(file);
    }
  }
  
}
