import { Component } from '@angular/core';
import {
  AfterViewInit,
  ChangeDetectorRef,
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

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  readonly socialIcons = ['facebook', 'instagram', 'twitter'];
  readonly logoAssetUrl = 'assets/logo2.png';

  currentYear: number = new Date().getFullYear();

}
