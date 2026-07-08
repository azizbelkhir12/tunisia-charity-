import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {

  contactInfo = {
    company: "TUNISIA CHARITY تونس الخيرية",
    address: "63 rue Iran 1002, Tunis",
    phone: "+216 28 391 000",
    email: " contact@tunisiacharity.org",
    hours: "Lundi - Vendredi: 9:00  - 17:00 ",
  
  };
  constructor(private translate: TranslateService) { }

  changeLang(lang: string) {
    this.translate.use(lang);
  }

  translatePage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

}
