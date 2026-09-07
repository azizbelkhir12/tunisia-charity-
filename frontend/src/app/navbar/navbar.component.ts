import { Component, HostListener, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

type LanguageCode = 'fr' | 'en' | 'ar';

interface Language {
  code: LanguageCode;
  label: string;
  short: string;
}
@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  open = false;

  scrolled = false;

  languageOpen = false;

  readonly logoAssetUrl = 'assets/logo2.png';

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

  currentLang: LanguageCode = 'fr';

  private readonly LANGUAGE_KEY = 'lang';

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    
    this.translate.setDefaultLang('fr');

    const savedLang = localStorage.getItem(
      this.LANGUAGE_KEY,
    ) as LanguageCode | null;

   
    const language: LanguageCode =
      savedLang === 'fr' || savedLang === 'en' || savedLang === 'ar'
        ? savedLang
        : 'fr';

   
    this.setLanguage(language);
  }

  
  selectLanguage(lang: LanguageCode): void {
    this.setLanguage(lang);

    this.languageOpen = false;
  }

  private setLanguage(lang: LanguageCode): void {
    this.currentLang = lang;

    
    this.translate.use(lang);

   
    localStorage.setItem(this.LANGUAGE_KEY, lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  closeMenu(): void {
    this.open = false;
  }

  
  toggleMenu(): void {
    this.open = !this.open;
  }

  toggleLanguageMenu(event: MouseEvent): void {
    event.stopPropagation();

    this.languageOpen = !this.languageOpen;
  }

  
  @HostListener('document:click')
  closeLanguageDropdown(): void {
    if (this.languageOpen) {
      this.languageOpen = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 20;
  }
}
