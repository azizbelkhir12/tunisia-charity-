import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GoogleMapsModule } from '@angular/google-maps';
import { QuillModule } from 'ngx-quill';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  ArrowRight,
  BookOpen,
  Facebook,
  HandHeart,
  Heart,
  Instagram,
  LogIn,
  LucideAngularModule,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Stethoscope,
  Twitter,
  UserPlus,
  Users,
  Utensils,
  X,
} from 'lucide-angular';


import { AppComponent } from './app.component';

// Composants
import { AcceuilComponent } from './acceuil/acceuil.component';
import { RegisterComponent } from './register/register.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { BenevolatComponent } from './benevolat/benevolat.component';
import { LoginComponent } from './login/login.component';

import { BenevoleCompteComponent } from './benevole-compte/benevole-compte.component';
import { BeneficiaireCompteComponent } from './beneficiaire-compte/beneficiaire-compte.component';

import { AdminCompteComponent } from './admin-compte/admin-compte.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { SidebarAdminComponent } from './sidebar-admin/sidebar-admin.component';
import { NavbarcompteAdminComponent } from './navbarcompte-admin/navbarcompte-admin.component';
import { GestionBenevolesComponent } from './gestion-benevoles/gestion-benevoles.component';
import { GestionBeneficiairesComponent } from './gestion-beneficiaires/gestion-beneficiaires.component';
import { GestionDesDonsComponent } from './gestion-des-dons/gestion-des-dons.component';
import { ContactComponent } from './contact/contact.component';
import { GestionNotificationComponent } from './gestion-notification/gestion-notification.component';
import { GestionDesRapportsComponent } from './gestion-des-rapports/gestion-des-rapports.component';

import { GestionFeedbackComponent } from './gestion-feedback/gestion-feedback.component';

import { DonRapideComponent } from './don-rapide/don-rapide.component';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';
import { PaymentFailComponent } from './pages/payment-fail/payment-fail.component';

import { GestionDesProjetsComponent } from './gestion-des-projets/gestion-des-projets.component';
import { VoirDocumentsBeneficiaireComponent } from './voir-documents-beneficiaire/voir-documents-beneficiaire.component';
import { ModifierInfosBeneficiaireComponent } from './modifier-infos-beneficiaire/modifier-infos-beneficiaire.component';
import { VoirNotificationsBeneficiaireComponent } from './voir-notifications-beneficiaire/voir-notifications-beneficiaire.component';
import { AjouterDesDocumentsBeneficiaireComponent } from './ajouter-des-documents-beneficiaire/ajouter-des-documents-beneficiaire.component';
import { NavBarMembreComponent } from './nav-bar-membre/nav-bar-membre.component';
import { FooterMembreComponent } from './footer-membre/footer-membre.component';
import { RapportsComponent } from './rapports/rapports.component';
import { DonateurCompteComponent } from './donateur-compte/donateur-compte.component';
import { ProfileDonateurComponent } from './profile-donateur/profile-donateur.component';
import { EffectuerDonComponent } from './effectuer-don/effectuer-don.component';
import { HistoriquePaiementComponent } from './historique-paiement donnateur/historique-paiement.component';
import { ParinnageEnfantsComponent } from './parinnage-enfants/parinnage-enfants.component';
import { RapportsDonnateurStandardComponent } from './rapports-donnateur-standard/rapports-donnateur-standard.component';
import { ChatComponent } from './chat/chat.component';
import { ProfilBenevoleComponent } from './profil-benevole/profil-benevole.component';
import { AbonnementBenevoleComponent } from './abonnement-benevole/abonnement-benevole.component';
import { HistoriquePaiementsComponent } from './historique-paiements benevoles/historique-paiements.component';
import { ChatAdminComponent } from './chat-admin/chat-admin.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';



// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}


@NgModule({
  declarations: [
    AppComponent,
    AcceuilComponent,
    RegisterComponent,
    NavbarComponent,
    FooterComponent,
    BenevolatComponent,
    LoginComponent,

    BenevoleCompteComponent,
    BeneficiaireCompteComponent,

    AdminCompteComponent,
    AdminLoginComponent,
    SidebarAdminComponent,
    NavbarcompteAdminComponent,
    GestionBenevolesComponent,
    GestionBeneficiairesComponent,
    GestionDesDonsComponent,
    ContactComponent,
    GestionNotificationComponent,
    GestionDesRapportsComponent,

    GestionFeedbackComponent,
    DonRapideComponent,
    PaymentSuccessComponent,
    PaymentFailComponent,

    GestionDesProjetsComponent,
      VoirDocumentsBeneficiaireComponent,
      ModifierInfosBeneficiaireComponent,
      VoirNotificationsBeneficiaireComponent,
      AjouterDesDocumentsBeneficiaireComponent,
      NavBarMembreComponent,
      FooterMembreComponent,
      RapportsComponent,
      ChatComponent,
      DonateurCompteComponent,
      ProfileDonateurComponent,
      EffectuerDonComponent,
      HistoriquePaiementComponent,
      ParinnageEnfantsComponent,
      RapportsDonnateurStandardComponent,
      ProfilBenevoleComponent,
      AbonnementBenevoleComponent,
      HistoriquePaiementsComponent,
      ChatAdminComponent,
      ForgotPasswordComponent,
      ResetPasswordComponent,
  ],
  
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    HttpClientModule,
    GoogleMapsModule,
    QuillModule.forRoot(),
    SweetAlert2Module.forRoot(),
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatOptionModule,
   LucideAngularModule.pick({
  ArrowRight,
  BookOpen,
  Facebook,
  HandHeart,
  Heart,
  Instagram,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Stethoscope,
  Twitter,
  UserPlus,
  Users,
  Utensils,
  X,
}),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
