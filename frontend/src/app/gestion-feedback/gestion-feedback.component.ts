import { Component, OnInit } from '@angular/core';
import {
  MessageSquare,
  Search,
  Trash2,
  Mail,
  CalendarDays,
  Users
} from 'lucide-angular';

import { ContactService } from '../services/contact/contact.service';

interface Feedback {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface StatCard {
  label: string;
  value: number;
  icon: any;
  colorClass: string;
}
@Component({
  selector: 'app-gestion-feedback',
  standalone: false,
  templateUrl: './gestion-feedback.component.html',
  styleUrl: './gestion-feedback.component.css'
})
export class GestionFeedbackComponent  {
readonly MessageSquare = MessageSquare;
  readonly Search = Search;
  readonly Trash2 = Trash2;
  readonly Mail = Mail;
  readonly CalendarDays = CalendarDays;
  readonly Users = Users;

  q = '';

  items: Feedback[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private ContactService: ContactService
  ) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  // =========================================================
  // LOAD FEEDBACKS
  // =========================================================

  loadFeedbacks(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ContactService.getContactForm().subscribe({
      next: (response: any) => {

        if (Array.isArray(response)) {
          this.items = response;
        } else if (Array.isArray(response?.feedbacks)) {
          this.items = response.feedbacks;
        } else if (Array.isArray(response?.data)) {
          this.items = response.data;
        } else {
          console.error(
            'Unexpected feedback response format:',
            response
          );

          this.items = [];
        }

        this.loading = false;
      },

      error: (error) => {
        console.error(
          'Error loading feedbacks:',
          error
        );

        this.items = [];
        this.loading = false;
        this.errorMessage =
          'Impossible de charger les feedbacks.';
      }
    });
  }

  // =========================================================
  // STATISTICS
  // =========================================================

  get totalFeedbacks(): number {
    return this.items.length;
  }

  get feedbacksThisMonth(): number {
    const now = new Date();

    return this.items.filter((feedback) => {
      if (!feedback.createdAt) {
        return false;
      }

      const feedbackDate = new Date(
        feedback.createdAt
      );

      if (isNaN(feedbackDate.getTime())) {
        return false;
      }

      return (
        feedbackDate.getFullYear() === now.getFullYear() &&
        feedbackDate.getMonth() === now.getMonth()
      );
    }).length;
  }

  get uniqueAuthors(): number {
    const emails = this.items
      .filter((feedback) => feedback.email)
      .map((feedback) =>
        feedback.email.trim().toLowerCase()
      );

    return new Set(emails).size;
  }

  get uniqueSubjects(): number {
    const subjects = this.items
      .filter((feedback) => feedback.subject)
      .map((feedback) =>
        feedback.subject.trim().toLowerCase()
      );

    return new Set(subjects).size;
  }

  get statsCards(): StatCard[] {
    return [
      {
        label: 'Total feedbacks',
        value: this.totalFeedbacks,
        icon: MessageSquare,
        colorClass: 'icon-primary'
      },
      {
        label: 'Ce mois-ci',
        value: this.feedbacksThisMonth,
        icon: CalendarDays,
        colorClass: 'icon-sky'
      },
      {
        label: 'Auteurs uniques',
        value: this.uniqueAuthors,
        icon: Users,
        colorClass: 'icon-green'
      },
      {
        label: 'Sujets distincts',
        value: this.uniqueSubjects,
        icon: Mail,
        colorClass: 'icon-orange'
      }
    ];
  }

  // =========================================================
  // SEARCH
  // =========================================================

  get filteredFeedbacks(): Feedback[] {
    const term = this.q
      .trim()
      .toLowerCase();

    if (!term) {
      return this.items;
    }

    return this.items.filter((feedback) => {
      const content = [
        feedback.name || '',
        feedback.email || '',
        feedback.subject || '',
        feedback.message || ''
      ]
        .join(' ')
        .toLowerCase();

      return content.includes(term);
    });
  }

  // =========================================================
  // DELETE
  // =========================================================

  remove(id: string): void {
    if (!id) {
      console.error('Feedback ID is missing');
      return;
    }

    const feedback = this.items.find(
      item => item._id === id
    );

    const confirmed = window.confirm(
      feedback
        ? `Supprimer définitivement le feedback de ${feedback.name} ?`
        : 'Supprimer définitivement ce feedback ?'
    );

    if (!confirmed) {
      return;
    }

    this.ContactService
      .deleteContactForm(id)
      .subscribe({
        next: (response) => {
          console.log(
            'Feedback deleted:',
            response
          );

          this.items = this.items.filter(
            item => item._id !== id
          );
        },

        error: (error) => {
          console.error(
            'Error deleting feedback:',
            error
          );

          window.alert(
            'Une erreur est survenue pendant la suppression.'
          );
        }
      });
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByFeedbackId(
    index: number,
    feedback: Feedback
  ): string {
    return feedback._id;
  }

  trackByStatLabel(
    index: number,
    stat: StatCard
  ): string {
    return stat.label;
  }
}