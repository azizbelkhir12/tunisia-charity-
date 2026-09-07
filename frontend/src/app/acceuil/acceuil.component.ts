import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

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
  labelKey: string;
  href: string;
};

type IconCard = {
  icon: string;
  titleKey: string;
  textKey: string;
};

type ActionCard = IconCard & {
  img: string;
};

interface Stat {
  value: number;
  labelKey: string;
  suffix: string;
  display: number;
  started: boolean;
}

type Project = {
  img: string;
  tag: string;
  title: string;
  text: string;
  progress: number;
};

type Lang = 'fr' | 'en' | 'ar';

type Language = {
  code: Lang;
  label: string;
  short: string;
};


@Component({
  selector: 'app-acceuil',
  standalone: false,
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.css',
})
export class AcceuilComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('statCard')
  statCards!: QueryList<ElementRef<HTMLElement>>;

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
    {
      labelKey: 'HOME.NAV.HOME',
      href: '#accueil',
    },
    {
      labelKey: 'HOME.NAV.ABOUT',
      href: '#a-propos',
    },
    {
      labelKey: 'HOME.NAV.ACTIONS',
      href: '#actions',
    },
    {
      labelKey: 'HOME.NAV.PROJECTS',
      href: '#projets',
    },
    {
      labelKey: 'HOME.NAV.CONTACT',
      href: '#feedback',
    },
  ];

  readonly aboutItems: IconCard[] = [
    {
      icon: 'heart',
      titleKey: 'HOME.ABOUT.ITEMS.SOLIDARITY.TITLE',
      textKey: 'HOME.ABOUT.ITEMS.SOLIDARITY.TEXT',
    },
    {
      icon: 'users',
      titleKey: 'HOME.ABOUT.ITEMS.COMMUNITY.TITLE',
      textKey: 'HOME.ABOUT.ITEMS.COMMUNITY.TEXT',
    },
    {
      icon: 'sparkles',
      titleKey: 'HOME.ABOUT.ITEMS.TRANSPARENCY.TITLE',
      textKey: 'HOME.ABOUT.ITEMS.TRANSPARENCY.TEXT',
    },
  ];

  readonly actions: ActionCard[] = [
    {
      img: this.actionEducation,
      icon: 'book-open',
      titleKey: 'HOME.ACTIONS.ITEMS.EDUCATION.TITLE',
      textKey: 'HOME.ACTIONS.ITEMS.EDUCATION.TEXT',
    },
    {
      img: this.actionFood,
      icon: 'utensils',
      titleKey: 'HOME.ACTIONS.ITEMS.SOCIAL.TITLE',
      textKey: 'HOME.ACTIONS.ITEMS.SOCIAL.TEXT',
    },
    {
      img: this.actionHealth,
      icon: 'stethoscope',
      titleKey: 'HOME.ACTIONS.ITEMS.SPONSORSHIP.TITLE',
      textKey: 'HOME.ACTIONS.ITEMS.SPONSORSHIP.TEXT',
    },
  ];

  readonly stats: Stat[] = [
    {
      value: 0,
      labelKey: 'HOME.IMPACT.STATS.DONORS',
      suffix: '+',
      display: 0,
      started: false,
    },
    {
      value: 0,
      labelKey: 'HOME.IMPACT.STATS.BENEFICIARIES',
      suffix: '+',
      display: 0,
      started: false,
    },
    {
      value: 0,
      labelKey: 'HOME.IMPACT.STATS.VOLUNTEERS',
      suffix: '',
      display: 0,
      started: false,
    },
    {
      value: 0,
      labelKey: 'HOME.IMPACT.STATS.PROJECTS',
      suffix: '',
      display: 0,
      started: false,
    },
  ];

  projects: Project[] = [];

  readonly socialIcons = ['facebook', 'instagram', 'twitter'];

  readonly languages: Language[] = [
    {
      code: 'fr',
      label: 'Français',
      short: 'FR',
    },
    {
      code: 'en',
      label: 'English',
      short: 'EN',
    },
    {
      code: 'ar',
      label: 'العربية',
      short: 'AR',
    },
  ];

  currentLang: Lang = 'fr';

  languageOpen = false;

  private readonly LANG_KEY = 'tc-lang';

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

  showAllProjects = false;

  private observer?: IntersectionObserver;

  private sentTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly contactService: ContactService,
    private readonly projetService: ProjetService,
    private readonly beneficiaryService: BeneficiaryService,
    private readonly volunteerService: VolunteerService,
    private readonly donorService: DonorsService,
    private readonly translate: TranslateService,
  ) {
    this.onScroll = this.onScroll.bind(this);

    this.translate.setDefaultLang('fr');
  }

  ngOnInit(): void {
    const savedLang = window.localStorage.getItem(
      this.LANG_KEY,
    ) as Lang | null;

    const validLanguage =
      savedLang &&
      this.languages.some((language) => language.code === savedLang)
        ? savedLang
        : 'fr';

    this.currentLang = validLanguage;

    this.translate.use(this.currentLang);

    this.applyDocumentLanguage();

    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.onScroll();

    window.addEventListener('scroll', this.onScroll, {
      passive: true,
    });

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
      {
        threshold: 0.3,
      },
    );

    this.statCards.forEach((card) => {
      this.observer?.observe(card.nativeElement);
    });
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

  get currentLanguage(): Language {
    return (
      this.languages.find(
        (language) => language.code === this.currentLang,
      ) ?? this.languages[0]
    );
  }

  toggleLanguageMenu(): void {
    this.languageOpen = !this.languageOpen;
  }

  selectLanguage(lang: Lang): void {
    this.currentLang = lang;

    this.languageOpen = false;

    window.localStorage.setItem(this.LANG_KEY, lang);

    this.translate.use(lang);

    this.applyDocumentLanguage();

    /*
     * Restart number formatting when changing language.
     */
    this.cdr.detectChanges();
  }

  private applyDocumentLanguage(): void {
    document.documentElement.lang = this.currentLang;

    document.documentElement.dir =
      this.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  @HostListener('document:mousedown', ['$event'])
  onLanguageOutsideClick(event: MouseEvent): void {
    const target = event.target as Element | null;

    if (
      this.languageOpen &&
      target &&
      !target.closest('.language-switcher')
    ) {
      this.languageOpen = false;
    }
  }

  private loadStats(): void {
    this.isLoadingStats = true;

    forkJoin({
      donors: this.donorService.getDonors(),

      beneficiaires:
        this.beneficiaryService.getBeneficiaires(),

      volunteers:
        this.volunteerService.getVolunteers(),

      projects:
        this.projetService.getProjects(),
    })
      .pipe(
        finalize(() => {
          this.isLoadingStats = false;
        }),
      )
      .subscribe({
        next: ({
          donors,
          beneficiaires,
          volunteers,
          projects,
        }) => {
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
            error,
          );
        },
      });
  }

  private getTotal(response: any): number {
    if (
      response === null ||
      response === undefined
    ) {
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

    if (
      Array.isArray(
        response?.data?.beneficiaries,
      )
    ) {
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
      console.warn(
        'Format des projets non reconnu :',
        response,
      );

      return [];
    }

    return projectList.map(
      (project: any) => ({
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
          this.translate.instant(
            'HOME.PROJECTS.DEFAULT_TAG',
          ),

        title:
          project.titre ??
          project.name ??
          project.nom ??
          this.translate.instant(
            'HOME.PROJECTS.DEFAULT_TITLE',
          ),

        text:
          project.description ??
          project.text ??
          '',

        progress:
          project.progress ??
          project.percentage ??
          project.progressPercentage ??
          0,
      }),
    );
  }

  get visibleProjects(): Project[] {
    return this.showAllProjects
      ? this.projects
      : this.projects.slice(0, 3);
  }

  toggleProjects(): void {
    this.showAllProjects =
      !this.showAllProjects;
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

        title: this.translate.instant(
          'HOME.CONTACT.ALERTS.REQUIRED_TITLE',
        ),

        text: this.translate.instant(
          'HOME.CONTACT.ALERTS.REQUIRED_TEXT',
        ),

        confirmButtonText: this.translate.instant(
          'HOME.CONTACT.ALERTS.OK',
        ),

        confirmButtonColor: '#1677ff',
      });

      return;
    }

    if (!this.isValidEmail(contactData.email)) {
      Swal.fire({
        icon: 'warning',

        title: this.translate.instant(
          'HOME.CONTACT.ALERTS.EMAIL_TITLE',
        ),

        text: this.translate.instant(
          'HOME.CONTACT.ALERTS.EMAIL_TEXT',
        ),

        confirmButtonText: this.translate.instant(
          'HOME.CONTACT.ALERTS.OK',
        ),

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

          this.status = 'sent';

          Swal.fire({
            icon: 'success',

            title: this.translate.instant(
              'HOME.CONTACT.ALERTS.SUCCESS_TITLE',
            ),

            text: this.translate.instant(
              'HOME.CONTACT.ALERTS.SUCCESS_TEXT',
            ),

            confirmButtonText: this.translate.instant(
              'HOME.CONTACT.ALERTS.CLOSE',
            ),

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
            this.translate.instant(
              'HOME.CONTACT.ALERTS.ERROR_TEXT',
            );

          Swal.fire({
            icon: 'error',

            title: this.translate.instant(
              'HOME.CONTACT.ALERTS.ERROR_TITLE',
            ),

            text: errorMessage,

            confirmButtonText: this.translate.instant(
              'HOME.CONTACT.ALERTS.RETRY',
            ),

            confirmButtonColor: '#f93737',
          });
        },
      });
  }

  private isValidEmail(
    email: string,
  ): boolean {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  }

  formatNumber(value: number): string {
    const locale =
      this.currentLang === 'ar'
        ? 'ar-TN'
        : this.currentLang === 'en'
          ? 'en-US'
          : 'fr-FR';

    return value.toLocaleString(locale);
  }

  private onScroll(): void {
    this.scrolled =
      window.scrollY > 20;
  }

  private animateCounter(
    stat: Stat,
  ): void {
    const duration = 2000;

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(
        1,
        (now - start) / duration,
      );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      stat.display = Math.floor(
        eased * stat.value,
      );

      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }
}
