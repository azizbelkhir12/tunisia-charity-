import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  open = false;
  scrolled = false;
  readonly logoAssetUrl = 'assets/logo2.png';
  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.translate.use(savedLang);
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  }

  changeLang(lang: string) {
    this.translate.use(lang);
  }

  closeMenu(): void {
    this.open = false;
  }

  toggleMenu(): void {
    this.open = !this.open;
  }

  translatePage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
}
