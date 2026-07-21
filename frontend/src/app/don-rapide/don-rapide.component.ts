import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

type PaymentMethodId =
  | 'virement'
  | 'en-ligne'
  | 'cash'
  | '';

interface Project {
  value: string;
  label: string;
}

interface PaymentMethod {
  id: Exclude<PaymentMethodId, ''>;
  label: string;
  icon: string;
}

interface DonationForm {
  fullName: string;
  amount: number | null;
  method: PaymentMethodId;
  project: string;
}

interface FormErrors {
  fullName?: string;
  amount?: string;
  method?: string;
  project?: string;
}

type FormField = keyof FormErrors;


@Component({
  selector: 'app-don-rapide',
  standalone: false,
  templateUrl: './don-rapide.component.html',
  styleUrl: './don-rapide.component.css'
})
export class DonRapideComponent implements OnInit {
 readonly projects: Project[] = [
    {
      value: 'education',
      label: 'Éducation pour tous'
    },
    {
      value: 'sante',
      label: 'Soins de santé primaires'
    },
    {
      value: 'eau',
      label: 'Accès à l’eau potable'
    },
    {
      value: 'abri',
      label: 'Abri d’urgence'
    },
    {
      value: 'alimentation',
      label: 'Aide alimentaire'
    },
    {
      value: 'general',
      label: 'Fonds généraux'
    }
  ];

  readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'virement',
      label: 'Virement bancaire',
      icon: 'landmark'
    },
    {
      id: 'en-ligne',
      label: 'Paiement en ligne',
      icon: 'credit-card'
    },
    {
      id: 'cash',
      label: 'Paiement en espèces',
      icon: 'banknote'
    }
  ];


  form: DonationForm = this.createEmptyForm();

  errors: FormErrors = {};

  submitted = false;
  loading = false;

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta
  ) {}

  ngOnInit(): void {
    this.configurePageMetadata();
  }

  /**
   * Nom du projet sélectionné.
   */
  get selectedProjectLabel(): string {
    return (
      this.projects.find(
        project => project.value === this.form.project
      )?.label ?? ''
    );
  }

  /**
   * Nom de la méthode de paiement sélectionnée.
   */
  get selectedMethodLabel(): string {
    return (
      this.paymentMethods.find(
        method => method.id === this.form.method
      )?.label ?? ''
    );
  }

  /**
   * Vérifie si une méthode de paiement est sélectionnée.
   */
  isMethodSelected(methodId: PaymentMethod['id']): boolean {
    return this.form.method === methodId;
  }

  /**
   * Sélectionne une méthode de paiement.
   */
  selectPaymentMethod(methodId: PaymentMethod['id']): void {
    this.form.method = methodId;
    this.clearError('method');
  }

  /**
   * Supprime l'erreur d'un champ après modification.
   */
  clearError(field: FormField): void {
    if (!this.errors[field]) {
      return;
    }

    this.errors = {
      ...this.errors,
      [field]: undefined
    };
  }

  /**
   * Validation complète du formulaire.
   */
  validateForm(): boolean {
    const validationErrors: FormErrors = {};
    const fullName = this.form.fullName.trim();
    const amount = Number(this.form.amount);

    if (!fullName) {
      validationErrors.fullName =
        'Le nom complet est requis.';
    } else if (fullName.length < 3) {
      validationErrors.fullName =
        'Le nom complet doit contenir au moins 3 caractères.';
    } else if (fullName.length > 100) {
      validationErrors.fullName =
        'Le nom complet ne doit pas dépasser 100 caractères.';
    }

    if (
      this.form.amount === null ||
      this.form.amount === undefined ||
      Number.isNaN(amount)
    ) {
      validationErrors.amount =
        'Veuillez indiquer un montant valide.';
    } else if (amount <= 0) {
      validationErrors.amount =
        'Le montant doit être supérieur à 0.';
    } else if (amount > 1_000_000) {
      validationErrors.amount =
        'Le montant semble trop élevé.';
    }

    if (!this.form.method) {
      validationErrors.method =
        'Veuillez choisir une méthode de paiement.';
    }

    if (!this.form.project) {
      validationErrors.project =
        'Veuillez choisir un projet.';
    }

    this.errors = validationErrors;

    return Object.keys(validationErrors).length === 0;
  }

  /**
   * Envoi du formulaire.
   */
  handleSubmit(): void {
    if (this.loading || !this.validateForm()) {
      return;
    }

    this.loading = true;

    /*
     * Simulation d'un appel API.
     * Cette partie pourra ensuite être remplacée
     * par un appel à DonationService.
     */
    window.setTimeout(() => {
      this.loading = false;
      this.submitted = true;

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 1200);
  }

  /**
   * Permet de recommencer un nouveau don.
   */
  makeAnotherDonation(): void {
    this.form = this.createEmptyForm();
    this.errors = {};
    this.submitted = false;
    this.loading = false;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private createEmptyForm(): DonationForm {
    return {
      fullName: '',
      amount: null,
      method: '',
      project: ''
    };
  }

  private configurePageMetadata(): void {
    const description =
      'Soutenez Tunisia Charity par un don unique ou régulier. ' +
      'Choisissez votre projet et votre mode de paiement.';

    this.titleService.setTitle(
      'Faire un don — Tunisia Charity'
    );

    this.metaService.updateTag({
      name: 'description',
      content: description
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: 'Faire un don — Tunisia Charity'
    });

    this.metaService.updateTag({
      property: 'og:description',
      content: description
    });
  }
}
