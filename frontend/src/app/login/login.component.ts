import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(private router: Router, private AuthService: AuthService, private translate: TranslateService) {}

  activeTab = 0; // Default active tab

  
  tabs = [
    { title: 'Bénévole', image: 'assets/login.jpg', userType: 'volunteer' },
    { title: 'Donnateur', image: 'assets/images/mission.jpg', userType: 'donor' },
    { title: 'Bénificaire', image: 'assets/images/vision.jpg', userType: 'beneficiary' },
  ];

  // Form data
  loginData = { 
    email: '', 
    password: '',
    userType: this.tabs[0].userType // Initialize with first tab's user type
  };

  // Error messages
  loginErrorMsg = ' veuillez remplir les champs';
  

  // Set active tab
  setActiveTab(index: number) {
    this.activeTab = index;
    this.loginData.userType = this.tabs[index].userType;
  }

  changeLang(lang: string) {
    this.translate.use(lang);
  }

  translatePage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  // Form submissions
  submitLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      this.loginErrorMsg = 'Veuillez remplir tous les champs';
      return;
    }

     // Add userType based on active tab
  const requestData = {
    ...this.loginData,
    userType: this.tabs[this.activeTab].userType // Add this line
  };
  console.log(this.loginData);

    this.AuthService.login(this.loginData).subscribe(
      (response) => {
        console.log('Login successful', response);
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect based on user type
        switch(this.loginData.userType) {
          case 'donor':
            this.router.navigate(['/donateur-compte']);
            break;
          case 'volunteer':
            this.router.navigate(['/benevole-compte']);
            break;
          case 'beneficiary':
            this.router.navigate(['/beneficiaire-compte']);
            break;
          default:
            this.router.navigate(['/']);
        }
      },
      (error) => {
        console.error('Login failed', error);
        this.loginErrorMsg = error.error?.message || 'Erreur de connexion';
      }
    );
  }

  
}
