import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ContactService } from '../services/contact/contact.service';
import { ProjetService } from '../services/projet/projet.service';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import { DonorsService } from '../services/donors/donors.service';
import { TranslationApiService } from '../services/translation/translation-api.service';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import Swal from 'sweetalert2';
//import { ScriptsService } from '../services/scripts.service';

@Component({
  selector: 'app-acceuil',
  standalone: false,
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css'
})
export class AcceuilComponent {
  scriptsService: any;
  successMessage: string = '';
  activeTab: string = 'about';
   private chatWidget: any;
   private originalTexts: Map<string, string> = new Map<string, string>();
   isTranslating: boolean = false;
   currentLanguage: string = 'fr';

  services = [
    { icon: 'flaticon-diet', title: ' Soutien à lÉducation des Enfants ', description: 'Fournir des fournitures scolaires et du soutien aux enfants orphelins.' },
    { icon: 'flaticon-water', title: 'Eau Pure', description: 'Assurer l\'accès à de l\'eau potable propre et sûre.' }
,   { icon: 'flaticon-orphelinat', title: 'Parrainage d\'Enfants', description: 'Trouver des parrains pour soutenir les enfants dans le besoin.' },

{ icon: 'flaticon-poverty', title: 'Lutte contre la pauvreté', description: 'Soutien aux familles précaires avec aide matérielle, éducative et sociale.' }
,{ icon: 'flaticon-emergency', title: 'Urgence humanitaire', description: 'Assistance immédiate aux victimes de crises avec aide alimentaire, abris et soins.' }
,{ icon: 'flaticon-social-care', title: 'Aide Sociale', description: 'Aider les personnes en situation difficile.' }

  ];

  facts = [
  { value: 0, text: 'Bénévole' },
  {  value: 0, text: 'Donateurs' },
  {  value: 0, text: 'Beneficiaire' },
  {  value: 0, text: 'Projets' }
];

  
  donateForm: FormGroup;
  contactForm: FormGroup;
  donationAmounts = [10, 20, 30];
  projets: any[] = [];


  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    private http: HttpClient, 
    private projetService: ProjetService ,
    private beneficiaryService: BeneficiaryService,
    private volunteerService: VolunteerService,
    private donorService: DonorsService, 
    private translationApiService: TranslationApiService
  ) {
    this.donateForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      amount: [this.donationAmounts[0], Validators.required]
    });

    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.chargerProjets();
    this.initializeChat();
    this.loadCounts();
  }

  async ngAfterViewInit() {
    this.animateNumbers();
  }

  private storeOriginalTexts() {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, a, button, span, label, div');
    const textSet = new Set<string>();
    
    elements.forEach(el => {
      const original = el.textContent?.trim();
      if (original && original.length > 1 && !this.isSystemText(original)) {
        textSet.add(original);
      }
    });
    
    textSet.forEach(text => {
      this.originalTexts.set(text, text);
    });
    
    console.log(`💾 ${this.originalTexts.size} textes uniques stockés`);
  }

  private isSystemText(text: string): boolean {
    const systemTexts = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return systemTexts.includes(text) || text.length < 2;
  }

  async translatePage(lang: string) {
    if (this.isTranslating) {
      console.log('⏳ Traduction déjà en cours...');
      return;
    }

    this.isTranslating = true;
    this.currentLanguage = lang;

    try {
      const swalResult = await Swal.fire({
        title: 'Traduction en cours...',
        text: 'Veuillez patienter, cela peut prendre quelques secondes',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Textes principaux pour la traduction
      const mainTexts = this.getMainTexts();
      const uniqueTexts = [...new Set(mainTexts.filter(text => text && text.length > 1))];

      console.log(`🌐 Début traduction: ${uniqueTexts.length} textes vers ${lang}`);

      if (uniqueTexts.length === 0) {
        this.storeOriginalTexts();
        Swal.fire({
          icon: 'warning',
          title: 'Aucun texte à traduire',
          text: 'Rechargement des textes...',
          confirmButtonText: 'OK'
        });
        this.isTranslating = false;
        return;
      }

      this.translationApiService.translateBatch(uniqueTexts, lang).subscribe({
        next: (translations) => {
          this.applyTranslations(translations, uniqueTexts);
          
          Swal.fire({
            icon: 'success',
            title: 'Traduction terminée !',
            text: `La page a été traduite en ${this.getLanguageName(lang)}`,
            timer: 2000,
            showConfirmButton: false
          });
          
          this.isTranslating = false;
        },
        error: (error) => {
          console.error('❌ Erreur traduction:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erreur de traduction',
            text: 'Impossible de traduire la page. Veuillez réessayer.',
            confirmButtonText: 'OK'
          });
          this.isTranslating = false;
        }
      });

    } catch (error) {
      console.error('❌ Erreur inattendue:', error);
      this.isTranslating = false;
    }
  }

  private getMainTexts(): string[] {
    return [
      // Navigation
      'Home', 'Contact', 'Rapports', 'Rejoignez-nous', 'Se Connecter', 'Créer compte', 
      'Faire un don', 'Langue', 'Français', 'English', 'العربية',

      // Bannière
      'Votre soutien a le pouvoir de transformer des vies de manière concrète et durable. Chaque geste de générosité permet de nourrir un enfant affamé, de soigner un malade sans ressources, d\'offrir un toit à une famille dans le besoin, ou de donner accès à l\'éducation à un jeune privé d\'avenir.',

      // À propos
      'À propos de nous', 'Aide humanitaire en Tunisie',
      'L\'association TUNISIA CHARITY تونس الخيرية est une organisation non gouvernementale à but non lucratif. Elle vise à servir la société en mobilisant les efforts des bienfaiteurs pour résoudre les problèmes de leurs communautés et venir en aide aux personnes dans le besoin. L\'association intervient dans le domaine du secours aux sinistrés en cas d\'urgence, du développement durable et de la lutte contre la pauvreté. Elle œuvre également à promouvoir l\'esprit de coopération et de solidarité au sein de la société.',

      // Services
      'Nos Actions', 'Nous croyons que nous pouvons sauver plus de vies avec vous',
      ...this.services.map(s => s.title),
      ...this.services.map(s => s.description),

      // Projets
      'Nos Projets', 'Explorons les différentes projets dans notre associations',

      // Contact
      'À Votre Écoute', 'Des questions ? Contactez-nous !',
      'Votre Nom', 'Votre Email', 'Sujet', 'Message',
      'Envoyer Message', 'Le message doit contenir au moins 10 caractères',
      'Veuillez entrer votre nom', 'Veuillez entrer une adresse e-mail valide',
      'Veuillez entrer un sujet',

      // Facts
      ...this.facts.map(f => f.text)
    ];
  }

  private applyTranslations(translations: any[], originalTexts: string[]) {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, a, button, span, label, div');
    let translationCount = 0;
    
    elements.forEach(el => {
      const original = el.textContent?.trim();
      if (original && original.length > 1) {
        const index = originalTexts.indexOf(original);
        if (index !== -1 && translations[index] && translations[index].success !== false) {
          const translatedText = translations[index].translatedText;
          if (translatedText && translatedText !== original) {
            el.textContent = translatedText;
            translationCount++;
          }
        }
      }
    });
    
    console.log(`✅ ${translationCount} traductions appliquées`);
    
    // Mettre à jour le texte du bouton de langue
    this.updateLanguageButton();
  }

  private updateLanguageButton() {
    const langButton = document.querySelector('#langDropdown');
    if (langButton) {
      const languageNames: Record<string, string> = {
        'fr': 'Français',
        'en': 'English', 
        'ar': 'العربية'
      };
      const label = languageNames[this.currentLanguage] ?? 'Langue';
      langButton.innerHTML = `<i class="fas fa-language"></i> ${label}`;
    }
  }

  private getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'fr': 'Français',
      'en': 'Anglais',
      'ar': 'Arabe'
    };
    return languages[code] || code;
  }

  loadCounts() {
  // Load Volunteers count
  this.volunteerService.getVolunteers().subscribe(volunteers => {
    this.facts[0].value = volunteers.length || 0;
    this.animateNumbers();
  });

  // Load Donors count
  this.donorService.getDonors().subscribe(donors => {
    this.facts[1].value = donors.length || 0;
    this.animateNumbers();
  });

  // Load Beneficiaries count
  this.beneficiaryService.getBeneficiaires().subscribe(response => {
    console.log('Beneficiaries:', response);
    // Access the beneficiaries array from the data property
    const beneficiaries = response.data.beneficiaries;
    this.facts[2].value = beneficiaries.length || 0;
    this.animateNumbers();
});

  // Load Projects count
  this.projetService.getProjects().subscribe(projects => {
    this.facts[3].value = projects.length || 0;
    this.animateNumbers();
  });
}

  
  chargerProjets() {
    this.projetService.getProjects().subscribe({
      next: (projets) => {
        this.projets = projets;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets:', err);
      }
    });
  }

  animateNumbers() {
  this.facts.forEach((fact, index) => {
    const end = fact.value;
    let start = 0;
    const duration = 2000; // Animation in 2 seconds
    
    // Only animate if the value is greater than 0
    if (end > 0) {
      const stepTime = Math.abs(Math.floor(duration / end));
      const increment = Math.ceil(end / 100); // Increment value

      const timer = setInterval(() => {
        if (start < end) {
          start += increment;
          // Create a new array to trigger change detection
          this.facts = [...this.facts];
          this.facts[index].value = Math.min(start, end);
        } else {
          clearInterval(timer);
        }
      }, stepTime);
    }
  });
}

  onSubmitForm() {
    if (this.contactForm.valid) {
      this.contactService.submitContactForm(this.contactForm.value).subscribe({
        next: (response: { message: string }) => {
          this.successMessage = response.message;
          this.contactForm.reset();
          Swal.fire({
            icon: 'success',
            title: 'Form Submitted',
            text: this.successMessage,
            confirmButtonText: 'OK'
          });
        },
        error: (error: any) => {
          console.error('Error submitting form:', error);
          Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: 'There was an error submitting the form. Please try again later.',
            confirmButtonText: 'OK'
          });
        }
      });
    }
  }
initializeChat() {
  this.chatWidget = createChat({
    webhookUrl: 'https://azizbelkhir562.app.n8n.cloud/webhook/9a2a284e-92e0-4cd2-af6e-bc43b821ba6f/chat'
  });
}
;

}