import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ContactService } from '../services/contact/contact.service';
import { ProjetService } from '../services/projet/projet.service';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import { DonorsService } from '../services/donors/donors.service';
import { TranslateService } from '@ngx-translate/core';


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
  {
    icon: 'flaticon-diet',
    title: 'SERVICE.ITEMS.EDUCATION.TITLE',
    description: 'SERVICE.ITEMS.EDUCATION.DESC'
  },
  {
    icon: 'flaticon-water',
    title: 'SERVICE.ITEMS.WATER.TITLE',
    description: 'SERVICE.ITEMS.WATER.DESC'
  },
  {
    icon: 'flaticon-orphelinat',
    title: 'SERVICE.ITEMS.SPONSORSHIP.TITLE',
    description: 'SERVICE.ITEMS.SPONSORSHIP.DESC'
  },
  {
    icon: 'flaticon-poverty',
    title: 'SERVICE.ITEMS.POVERTY.TITLE',
    description: 'SERVICE.ITEMS.POVERTY.DESC'
  },
  {
    icon: 'flaticon-emergency',
    title: 'SERVICE.ITEMS.EMERGENCY.TITLE',
    description: 'SERVICE.ITEMS.EMERGENCY.DESC'
  },
  {
    icon: 'flaticon-social-care',
    title: 'SERVICE.ITEMS.SOCIAL.TITLE',
    description: 'SERVICE.ITEMS.SOCIAL.DESC'
  }
];


  facts = [
  { value: 0, text: 'FACTS.ITEMS.VOLUNTEERS' },
  { value: 0, text: 'FACTS.ITEMS.DONORS' },
  { value: 0, text: 'FACTS.ITEMS.BENEFICIARIES' },
  { value: 0, text: 'FACTS.ITEMS.PROJECTS' }
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
    private translate: TranslateService
  ) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.translate.use(savedLang);
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

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

  translatePage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  async ngAfterViewInit() {
    this.animateNumbers();
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