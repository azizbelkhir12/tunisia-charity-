import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  ArrowRight,
  BookOpen,
  Facebook,
  HandHeart,
  Heart,
  Instagram,
  LucideAngularModule,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Stethoscope,
  Twitter,
  Users,
  Utensils,
  X,
} from 'lucide-angular';
import { ContactService } from '../services/contact/contact.service';
import { ProjetService } from '../services/projet/projet.service';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import { DonorsService } from '../services/donors/donors.service';
import Swal from 'sweetalert2';

type NavItem = {
  label: string;
  href: string;
};

type IconCard = {
  icon: string;
  title: string;
  text: string;
};

type ActionCard = IconCard & {
  img: string;
};

interface Stat {
  value: number;
  label: string;
  suffix: string;
  display: number;
  started: boolean;
};

type Project = {
  img: string;
  tag: string;
  title: string;
  text: string;
  progress: number;
};



@Component({
  selector: 'app-acceuil',
  standalone: false,
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css',
})
export class AcceuilComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('statCard') statCards!: QueryList<ElementRef<HTMLElement>>;

  readonly currentYear = new Date().getFullYear();
  readonly heroImg = 'assets/children.png';
  readonly actionFood = 'assets/aboutf.jpg';
  readonly actionEducation = 'assets/educatif.jpg';
  readonly actionHealth = 'assets/volunteer.jpg';
  readonly projectWater = 'assets/banner.jpg';
  readonly projectGreen = 'assets/facts.jpg';
  readonly projectShelter = 'assets/contact.jpg';
  readonly logoAssetUrl = 'assets/logo2.png';

  readonly nav: NavItem[] = [
    { label: 'Accueil', href: '#accueil' },
    { label: 'À propos', href: '#a-propos' },
    { label: 'Nos actions', href: '#actions' },
    { label: 'Projets', href: '#projets' },
    { label: 'Contact', href: '#feedback' },
  ];

  readonly aboutItems: IconCard[] = [
    {
      icon: 'heart',
      title: 'Solidarité',
      text: "Une aide inconditionnelle, partout où c'est nécessaire.",
    },
    {
      icon: 'users',
      title: 'Communauté',
      text: 'Un réseau de bénévoles engagés sur le terrain.',
    },
    {
      icon: 'sparkles',
      title: 'Transparence',
      text: '100% des dons tracés, rapports publiés chaque année.',
    },
  ];

  readonly actions: ActionCard[] = [
    {
      img: this.actionEducation,
      icon: 'book-open',
      title: 'Éducation pour tous',
      text: 'Écoles, matériel scolaire et bourses pour les enfants défavorisés.',
    },
    {
      img: this.actionFood,
      icon: 'utensils',
      title: 'Aide Social',
      text: 'Aider les personnes en situation difficile.',
    },
    {
      img: this.actionHealth,
      icon: 'stethoscope',
      title: 'parainage des enfants',
      text: 'Trouver des parrains pour soutenir les enfants dans le besoin.',
    },
  ];

   readonly stats: Stat[] = [
    {
      value: 0,
      label: 'Donateurs',
      suffix: '+',
      display: 0,
      started: false,
    },
    {
      value: 0,
      label: 'Bénéficiaires',
      suffix: '+',
      display: 0,
      started: false,
    },
    {
      value: 0,
      label: 'Bénévoles',
      suffix: '',
      display: 0,
      started: false,
    },
    {
      value: 0,
      label: 'Projets menés',
      suffix: '',
      display: 0,
      started: false,
    },
  ];
  projects: Project[] = [];
  readonly socialIcons = ['facebook', 'instagram', 'twitter'];

  isSubmittingContact = false;
  isLoadingStats = false;
  open = false;
  scrolled = false;
  status: 'idle' | 'sent' = 'idle';
  form = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };

  private observer?: IntersectionObserver;
  private sentTimeout?: ReturnType<typeof setTimeout>;

  constructor(private readonly cdr: ChangeDetectorRef,
    private contactService: ContactService,
    private projetService: ProjetService ,
    private beneficiaryService: BeneficiaryService,
    private volunteerService: VolunteerService,
    private donorService: DonorsService, 
  ) {
    this.onScroll = this.onScroll.bind(this);
  }

   ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.onScroll();
    window.addEventListener('scroll', this.onScroll, { passive: true });

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(
            (entry.target as HTMLElement).dataset['statIndex'],
          );
          const stat = this.stats[index];

          if (entry.isIntersecting && stat && !stat.started) {
            stat.started = true;
            this.animateCounter(stat);
          }
        });
      },
      { threshold: 0.3 },
    );

    this.statCards.forEach((card) =>
      this.observer?.observe(card.nativeElement),
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
    this.observer?.disconnect();

    if (this.sentTimeout) {
      clearTimeout(this.sentTimeout);
    }
  }

  closeMenu(): void {
    this.open = false;
  }

  toggleMenu(): void {
    this.open = !this.open;
  }

  private loadStats(): void {
    this.isLoadingStats = true;

    forkJoin({
      donors: this.donorService.getDonors(),
      beneficiaires: this.beneficiaryService.getBeneficiaires(),
      volunteers: this.volunteerService.getVolunteers(),
      projects: this.projetService.getProjects(),
    })
      .pipe(finalize(() => (this.isLoadingStats = false)))
      .subscribe({
        next: ({ donors, beneficiaires, volunteers, projects }) => {
  this.stats[0].value = this.getTotal(donors);

  this.stats[1].value =
    beneficiaires?.results ??
    beneficiaires?.data?.beneficiaries?.length ??
    0;

  this.stats[2].value = this.getTotal(volunteers);

  this.stats[3].value =
    projects?.results ??
    projects?.data?.projects?.length ??
    this.getTotal(projects);

  this.projects = this.extractProjects(projects);

  this.stats.forEach((stat) => {
    stat.display = 0;
    stat.started = false;
  });

  this.cdr.detectChanges();
},
        error: (error) => {
          console.error(
            'Erreur lors du chargement des statistiques :',
            error
          );
        },
      });
  }

  private getTotal(response: any): number {
  if (response === null || response === undefined) {
    return 0;
  }

  if (typeof response === 'number') {
    return response;
  }

  if (Array.isArray(response)) {
    return response.length;
  }

  if (typeof response?.totalElements === 'number') {
    return response.totalElements;
  }

  if (typeof response?.count === 'number') {
    return response.count;
  }

  if (typeof response?.total === 'number') {
    return response.total;
  }

  if (typeof response?.results === 'number') {
    return response.results;
  }

  if (Array.isArray(response?.data)) {
    return response.data.length;
  }

  if (Array.isArray(response?.content)) {
    return response.content.length;
  }

  if (Array.isArray(response?.data?.beneficiaries)) {
    return response.data.beneficiaries.length;
  }

  return 0;
}

private extractProjects(response: any): Project[] {
  const projectList =
    response?.data?.projects ??
    response?.projects ??
    response?.data ??
    response ??
    [];

  if (!Array.isArray(projectList)) {
    console.warn('Format des projets non reconnu :', response);
    return [];
  }

  return projectList.map((project: any) => ({
    img:
      project.image ??
      project.img ??
      project.imageUrl ??
      project.photo ??
      this.projectWater,

    tag:
      project.category ??
      project.tag ??
      project.type ??
      'Projet solidaire',

    title:
      project.titre ??
      project.name ??
      project.nom ??
      'Projet',

    text:
      project.description ??
      project.text ??
      '',

    progress:
      project.progress ??
      project.percentage ??
      project.progressPercentage ??
      0,
  }));
}

showAllProjects = false;

get visibleProjects() {
  return this.showAllProjects
    ? this.projects
    : this.projects.slice(0, 3);
}

toggleProjects(): void {
  this.showAllProjects = !this.showAllProjects;
}


  onSubmit(): void {
  const contactData = {
    name: this.form.name.trim(),
    email: this.form.email.trim(),
    subject: this.form.subject.trim(),
    message: this.form.message.trim(),
  };

  if (
    !contactData.name ||
    !contactData.email ||
    !contactData.message
  ) {
    Swal.fire({
      icon: 'warning',
      title: 'Champs obligatoires',
      text: 'Veuillez renseigner votre nom, votre email et votre message.',
      confirmButtonText: 'D’accord',
      confirmButtonColor: '#1677ff',
    });

    return;
  }

  if (!this.isValidEmail(contactData.email)) {
    Swal.fire({
      icon: 'warning',
      title: 'Email invalide',
      text: 'Veuillez saisir une adresse email valide.',
      confirmButtonText: 'D’accord',
      confirmButtonColor: '#1677ff',
    });

    return;
  }

  this.isSubmittingContact = true;

  this.contactService
    .submitContactForm(contactData)
    .pipe(
      finalize(() => {
        this.isSubmittingContact = false;
        this.cdr.detectChanges();
      }),
    )
    .subscribe({
      next: () => {
        this.form = {
          name: '',
          email: '',
          subject: '',
          message: '',
        };

        Swal.fire({
          icon: 'success',
          title: 'Message envoyé',
          text: 'Merci ! Votre message a bien été envoyé.',
          confirmButtonText: 'Fermer',
          confirmButtonColor: '#1677ff',
        });
      },

      error: (error) => {
        console.error(
          'Erreur lors de l’envoi du formulaire de contact :',
          error,
        );

        const errorMessage =
          error?.error?.message ??
          error?.error?.error ??
          'Une erreur est survenue lors de l’envoi du message. Veuillez réessayer.';

        Swal.fire({
          icon: 'error',
          title: 'Envoi impossible',
          text: errorMessage,
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#f93737',
        });
      },
    });
}

private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  private onScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  private animateCounter(stat: Stat): void {
    const duration = 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      stat.display = Math.floor(eased * stat.value);
      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }
}
