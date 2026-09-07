import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

type PaymentMethodId =
  | 'virement'
  | 'en-ligne'
  | 'cash'
  | '';

interface Project {
  value: string;
  labelKey: string;
}

interface PaymentMethod {
  id: Exclude<PaymentMethodId, ''>;
  labelKey: string;
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
      labelKey: 'DONATION_PAGE.PROJECTS.EDUCATION'
    },
    {
      value: 'sante',
      labelKey: 'DONATION_PAGE.PROJECTS.HEALTH'
    },
    {
      value: 'eau',
      labelKey: 'DONATION_PAGE.PROJECTS.WATER'
    },
    {
      value: 'abri',
      labelKey: 'DONATION_PAGE.PROJECTS.SHELTER'
    },
    {
      value: 'alimentation',
      labelKey: 'DONATION_PAGE.PROJECTS.FOOD'
    },
    {
      value: 'general',
      labelKey: 'DONATION_PAGE.PROJECTS.GENERAL'
    }
  ];

  readonly paymentMethods: PaymentMethod[] = [
    {
      id: 'virement',
      labelKey: 'DONATION_PAGE.PAYMENT_METHODS.BANK_TRANSFER',
      icon: 'landmark'
    },
    {
      id: 'en-ligne',
      labelKey: 'DONATION_PAGE.PAYMENT_METHODS.ONLINE',
      icon: 'credit-card'
    },
    {
      id: 'cash',
      labelKey: 'DONATION_PAGE.PAYMENT_METHODS.CASH',
      icon: 'banknote'
    }
  ];

  form: DonationForm = this.createEmptyForm();

  errors: FormErrors = {};

  submitted = false;
  loading = false;

  constructor(
    private readonly titleService: Title,
    private readonly metaService: Meta,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.configurePageMetadata();
  }

  /**
   * Nom du projet sélectionné.
   */
  get selectedProjectLabel(): string {
    const project = this.projects.find(
      project => project.value === this.form.project
    );

    return project
      ? this.translate.instant(project.labelKey)
      : '';
  }

  /**
   * Nom de la méthode de paiement sélectionnée.
   */
  get selectedMethodLabel(): string {
    const method = this.paymentMethods.find(
      method => method.id === this.form.method
    );

    return method
      ? this.translate.instant(method.labelKey)
      : '';
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
        this.translate.instant(
          'DONATION_PAGE.ERRORS.FULL_NAME_REQUIRED'
        );
    } else if (fullName.length < 3) {
      validationErrors.fullName =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.FULL_NAME_MIN'
        );
    } else if (fullName.length > 100) {
      validationErrors.fullName =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.FULL_NAME_MAX'
        );
    }

    if (
      this.form.amount === null ||
      this.form.amount === undefined ||
      Number.isNaN(amount)
    ) {
      validationErrors.amount =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.AMOUNT_REQUIRED'
        );
    } else if (amount <= 0) {
      validationErrors.amount =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.AMOUNT_POSITIVE'
        );
    } else if (amount > 1_000_000) {
      validationErrors.amount =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.AMOUNT_TOO_HIGH'
        );
    }

    if (!this.form.method) {
      validationErrors.method =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.PAYMENT_METHOD_REQUIRED'
        );
    }

    if (!this.form.project) {
      validationErrors.project =
        this.translate.instant(
          'DONATION_PAGE.ERRORS.PROJECT_REQUIRED'
        );
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

  /**
   * Les métadonnées restent volontairement en dur.
   */
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
