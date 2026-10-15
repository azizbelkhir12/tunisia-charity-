import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth/auth.service';
import { PaymentService } from '../services/payment/payment.service';
import { DonorsService } from '../services/donors/donors.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-effectuer-don',
  standalone: false,
  templateUrl: './effectuer-don.component.html',
  styleUrl: './effectuer-don.component.css'
})
export class EffectuerDonComponent {
  paymentForm: FormGroup;
  isLoading = false;
  paymentSuccess = false;
  message: string = '';
  showPaymentType = false;

  // Bank information
  private bankInfo = {
    bankName: 'Your Bank Name',
    accountName: 'Your Organization Name',
    accountNumber: 'XXXX XXXX XXXX XXXX',
    iban: 'TNXX XXXX XXXX XXXX XXXX XXXX',
    rib: 'XXXX XXXX XXXX XXXX XXXX XX',
    swiftCode: 'XXXXXX'
  };

  // Cash payment information
  private cashPaymentInfo = {
    address: '63 rue Iran 1002, Tunis, Tunisia',
    phoneNumber: '+216 28 391 000',
    workingHours: 'Lundi - Vendredi: 9:00 - 17:00'
  };

  constructor(
    private fb: FormBuilder,
    private donorsService: DonorsService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.paymentForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1)]],
  paymentMethod: ['credit_card', Validators.required],
  paymentType: ['local', Validators.required],
  guestName: ['', Validators.required],
  guestEmail: ['', [Validators.required, Validators.email]],
  project: ['', Validators.required]
    });

    // Watch for payment method changes
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.showPaymentType = method === 'credit_card';
      if (!this.showPaymentType) {
        this.paymentForm.patchValue({ paymentType: 'local' });
      }
      if (method === 'bank_transfer') {
        this.showBankInformation();
      } else if (method === 'cash') {
        this.showCashPaymentInformation();
      }
    });
  }

  ngOnInit() {
    this.checkPaymentReturn();
  }

  showBankInformation() {
    Swal.fire({
      title: 'Informations de Virement Bancaire',
      html: `
        <div style="text-align: left;">
          <p><strong>Nom de la Banque :</strong> ${this.bankInfo.bankName}</p>
          <p><strong>Nom du Compte :</strong> ${this.bankInfo.accountName}</p>
          <p><strong>Numéro de Compte :</strong> ${this.bankInfo.accountNumber}</p>
          <p><strong>IBAN :</strong> ${this.bankInfo.iban}</p>
          <p><strong>RIB :</strong> ${this.bankInfo.rib}</p>
          <p><strong>Code SWIFT :</strong> ${this.bankInfo.swiftCode}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Je Comprends',
      footer: 'Veuillez utiliser votre nom comme référence de paiement'
    });
  }

  showCashPaymentInformation() {
    Swal.fire({
      title: 'Informations de Paiement en Espèces',
      html: `
        <div style="text-align: left;">
          <p><strong>Adresse :</strong> ${this.cashPaymentInfo.address}</p>
          <p><strong>Numéro de Téléphone :</strong> ${this.cashPaymentInfo.phoneNumber}</p>
          <p><strong>Heures de Travail :</strong></p>
          <p style="white-space: pre-line;">${this.cashPaymentInfo.workingHours}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Je Comprends',
      footer: 'Veuillez apporter le montant exact si possible'
    });
  }

  checkPaymentReturn() {
    this.route.queryParams.subscribe(params => {
      const paymentId = params['payment_id'];
      if (paymentId) {
        const pendingDonationStr = sessionStorage.getItem('pendingDonation');
        if (pendingDonationStr) {
          const pendingDonation = JSON.parse(pendingDonationStr);
          if (pendingDonation.paymentMethod === 'credit_card' || pendingDonation.paymentMethod === 'flouci') {
            this.handlePaymentCallback(paymentId);
          } else {
            sessionStorage.removeItem('pendingDonation');
          }
        }
      }
    });
  }

  onSubmit() {
    if (this.paymentForm.invalid) return;
  
    this.isLoading = true;
    const formData = this.paymentForm.value;
  
    // Determine payment method based on type selection
    if (formData.paymentMethod === 'credit_card' && formData.paymentType === 'flouci') {
      formData.paymentType = 'local';  // Keep paymentType separately
    }
  
  
    if (formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'cash') {
      // Handle bank transfer or cash payment (add your Swal logic here)
      this.handleBankOrCashPayment(formData);
    } else {
      // For Credit card or Flouci payment, store data in session and redirect
      sessionStorage.setItem('pendingDonation', JSON.stringify(formData));
      this.initiatePaymentFlow(formData);
    }
  }


  handleBankOrCashPayment(formData: any) {
      Swal.fire({
        title: 'Rappel Important',
        html: formData.paymentMethod === 'bank_transfer'
          ? 'Veuillez inclure votre nom dans la référence de virement bancaire.'
          : 'Veuillez apporter le montant exact à notre bureau pendant les heures de travail.',
        icon: 'warning',
        confirmButtonText: 'Je Comprends',
        showCancelButton: true,
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          this.createDonation(formData);
        } else {
          this.isLoading = false;
        }
      });
    }

  initiatePaymentFlow(formData: any) {
      // Ensure paymentType is set
      if (!formData.paymentType) {
        formData.paymentType = 'local'; // default value
      }
      this.donorsService.Payment(formData).subscribe({
        next: (res: any) => {
          if (res?.result?.link) {
            window.location.href = res.result.link; // Redirect to Flouci
          } else {
            Swal.fire('Erreur', 'Lien de paiement non reçu', 'error');
            this.isLoading = false;
          }
        },
        error: (error) => {
          Swal.fire('Erreur', error.error?.message || 'Échec de l\'initialisation du paiement', 'error');
          this.isLoading = false;
        }
      });
    }


  handlePaymentCallback(paymentId: string) {
      this.isLoading = true;
      const pendingDonation = JSON.parse(sessionStorage.getItem('pendingDonation') || '{}');
    
      if (!pendingDonation.amount) {
        Swal.fire('Erreur', 'Informations de don non trouvées', 'error');
        this.isLoading = false;
        return;
      }
    
      this.donorsService.verifyPayment(paymentId, pendingDonation).subscribe({
        next: (verification: any) => {
          if (verification.success) {
            const donationData = {
              ...pendingDonation,
              paymentId: paymentId,
              paymentDetails: verification.paymentDetails,
              status: 'completed'
            };
            this.createDonation(donationData);
          } else {
            this.handlePaymentError('Échec de la vérification du paiement');
          }
        },
        error: (error) => {
          this.handlePaymentError(error.error?.message || 'Erreur de vérification du paiement');
        }
      });
    }

    private createDonation(donationData: any) {
      const donorId = this.authService.getCurrentUserId();
    
      if (!donorId) {
        this.handlePaymentError("Utilisateur non authentifié.");
        return;
      }
    
      const completeDonationData = {
        ...donationData,
        paymentType: donationData.paymentType || 'local',
        donorId: donorId // include donor ID
      };
    
      this.donorsService.createDonation(completeDonationData).subscribe({
        next: () => {
          Swal.fire('Succès', 'Merci pour votre don!', 'success');
          this.paymentSuccess = true;
          sessionStorage.removeItem('pendingDonation');
          this.isLoading = false;
        },
        error: (err) => {
          this.handlePaymentError(err.error?.message || err.message || 'Erreur lors de l\'enregistrement du don');
        }
      });
    }
    
    
  private handlePaymentError(errorMessage: string) {
      Swal.fire('Erreur', errorMessage, 'error');
      this.isLoading = false;
      sessionStorage.removeItem('pendingDonation');
      console.error(errorMessage);
      
    }
}
