import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import Swal from 'sweetalert2';

interface TokenPayload {
  id: string; // Adjust the field name and type based on your token structure
}
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-ajouter-des-documents-beneficiaire',
  standalone: false,
  templateUrl: './ajouter-des-documents-beneficiaire.component.html',
  styleUrl: './ajouter-des-documents-beneficiaire.component.css'
})
export class AjouterDesDocumentsBeneficiaireComponent {
    documentForm: FormGroup;  
    personalPhotoPreview: string | ArrayBuffer | null = null;
    housePhotoPreview: string | ArrayBuffer | null = null;
    bulletinPreview: string = '';

    constructor(private fb: FormBuilder , private beneficiaryService: BeneficiaryService) {
      this.documentForm = this.fb.group({
        personalPhoto: [null, Validators.required],
        housePhoto: [null, Validators.required],
        bulletin: [null, Validators.required]
      });
    }

    onFileChange(event: any, field: string): void {
      const file = event.target.files[0];
      if (file) {
        if (field === 'personalPhoto' || field === 'housePhoto') {
          const reader = new FileReader();
          reader.onload = () => {
            if (field === 'personalPhoto') {
              this.personalPhotoPreview = reader.result;
            } else {
              this.housePhotoPreview = reader.result;
            }
          };
          reader.readAsDataURL(file);
        } else if (field === 'bulletin') {
          this.bulletinPreview = file.name;
        }
      }
    }

    getBeneficiaryIdFromToken(): string | null {
      const token = localStorage.getItem('token'); // or wherever your token is stored
      if (!token) return null;
    
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        return decoded.id; // adjust field name based on your token
      } catch (error) {
        console.error('Failed to decode token', error);
        return null;
      }
    }
    

    onSubmit(): void {
      if (this.documentForm.valid) {
        const beneficiaryId = this.getBeneficiaryIdFromToken();
    
        if (!beneficiaryId) {
          Swal.fire({
            icon: 'error',
            title: 'Unauthorized',
            text: 'Unable to identify beneficiary. Please login again.',
          });
          return;
        }
    
        const formData = new FormData();
        const personalPhotoInput = (document.getElementById('personal-photo') as HTMLInputElement);
        const housePhotoInput = (document.getElementById('house-photo') as HTMLInputElement);
        const bulletinInput = (document.getElementById('bulletin') as HTMLInputElement);
    
        if (personalPhotoInput.files?.length) {
          formData.append('personalPhoto', personalPhotoInput.files[0]);
        }
        if (housePhotoInput.files?.length) {
          formData.append('housePhoto', housePhotoInput.files[0]);
        }
        if (bulletinInput.files?.length) {
          formData.append('bulletin', bulletinInput.files[0]);
        }

        Swal.fire({
          title: 'Uploading...',
          text: 'Please wait while your documents are being uploaded.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
    
        this.beneficiaryService.uploadDocuments(beneficiaryId, formData).subscribe({
          next: (response) => {
            Swal.close();
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Documents uploaded successfully!',
            });
          },
          error: (err) => {
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to upload documents. Please try again.',
            });
          }
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Form',
          text: 'Please fill out all required fields before submitting.',
        });
      }
    }
    
  }

function jwt_decode<T>(token: string) {
  throw new Error('Function not implemented.');
}

