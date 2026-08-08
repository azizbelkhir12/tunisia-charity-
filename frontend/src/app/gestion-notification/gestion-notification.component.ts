import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import {
  Bell,
  User,
  Users,
  Megaphone,
  Search,
  Send,
  Check,
  Trash2,
} from 'lucide-angular';

import { NotificationService } from '../services/notification/notification.service';
import { VolunteerService } from '../services/volunteer/volunteer.service';
import { DonorsService } from '../services/donors/donors.service';
import { BeneficiaryService } from '../services/beneficiary/beneficiary.service';

type NotifType = 'monocast' | 'multicast' | 'broadcast';
type ViewType = 'envoyer' | 'historique';
type MemberRole = 'Bénévole' | 'Donateur' | 'Bénéficiaire';
type RoleFilter = 'all' | MemberRole;

interface Member {
  id: string;
  nom: string;
  email: string;
  role: MemberRole;
}

interface NotificationItem {
  _id: string;
  titre: string;
  contenu: string;
  idBeneficiaire: any;
  dateEnvoi: string;
  lu: boolean;
}

@Component({
  selector: 'app-gestion-notification',
  templateUrl: './gestion-notification.component.html',
  standalone: false,
  styleUrls: ['./gestion-notification.component.css'],
})
export class GestionNotificationComponent {
  readonly BellIcon = Bell;
  readonly UserIcon = User;
  readonly UsersIcon = Users;
  readonly MegaphoneIcon = Megaphone;
  readonly SearchIcon = Search;
  readonly SendIcon = Send;
  readonly CheckIcon = Check;
  readonly TrashIcon = Trash2;

  members: Member[] = [];

  notifications: NotificationItem[] = [];

  view: ViewType = 'envoyer';

  type: NotifType = 'monocast';

  selected: string[] = [];

  q = '';

  roleFilter: RoleFilter = 'all';

  titre = '';

  contenu = '';

  errors: Record<string, string> = {};

  loading = false;

  sending = false;

  sent = false;

  errorMessage = '';
  totalNotifications = 0;

  totalMembers = 0;

  totalBroadcasts = 0;
  readonly types = [
    {
      key: 'monocast' as NotifType,
      label: 'Monocast',
      desc: 'Un seul membre',
      icon: User,
    },
    {
      key: 'multicast' as NotifType,
      label: 'Multicast',
      desc: 'Un groupe de membres',
      icon: Users,
    },
    {
      key: 'broadcast' as NotifType,
      label: 'Broadcast',
      desc: 'Tous les membres',
      icon: Megaphone,
    },
  ];

  constructor(
    private notificationService: NotificationService,
    private volunteerService: VolunteerService,
    private donorsService: DonorsService,
    private beneficiaryService: BeneficiaryService,
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      beneficiaires: this.beneficiaryService.getBeneficiaires().pipe(
        catchError((error) => {
          console.error('Erreur chargement bénéficiaires:', error);

          return of([]);
        }),
      ),

      donors: this.donorsService.getDonors().pipe(
        catchError((error) => {
          console.error('Erreur chargement donateurs:', error);

          return of([]);
        }),
      ),

      volunteers: this.volunteerService.getVolunteers().pipe(
        catchError((error) => {
          console.error('Erreur chargement bénévoles:', error);

          return of([]);
        }),
      ),

      notifications: this.notificationService.getAllNotifications().pipe(
        catchError((error) => {
          console.error('Erreur chargement notifications:', error);
          return of([]);
        }),
      ),

      stats: this.notificationService.getNotificationStats().pipe(
        catchError((error) => {
          console.error('Erreur chargement statistiques:', error);

          return of({});
        }),
      ),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (res: any) => {
          const beneficiaires = this.getArray(res.beneficiaires, ['beneficiaires','beneficiaries','data',]);

          const beneficiaryMembers: Member[] = beneficiaires.map((b: any) => {
            const prenom = b.Prenom || b.prenom || b.firstName || '';

            const nom = b.name || b.nom || b.lastName || '';

            return {
              id: b._id || b.id || '',

              nom:
                b.fullName ||
                `${prenom} ${nom}`.trim() ||
                b.email ||
                'Bénéficiaire',

              email: b.email || '',

              role: 'Bénéficiaire',
            };
          });

          const donors = this.getArray(res.donors, ['donors', 'data']);

          const donorMembers: Member[] = donors.map((d: any) => {
            const prenom = d.Prenom || d.prenom || d.firstName || '';

            const nom = d.name || d.nom || d.lastName || '';

            return {
              id: d._id || d.id || '',

              nom:
                d.fullName ||
                `${prenom} ${nom}`.trim() ||
                d.email ||
                'Donateur',

              email: d.email || '',

              role: 'Donateur',
            };
          });

          const volunteers = this.getArray(res.volunteers, [
            'volunteers',
            'data',
          ]);

          const volunteerMembers: Member[] = volunteers.map((v: any) => {
            const prenom = v.Prenom || v.prenom || v.firstName || '';

            const nom = v.name || v.nom || v.lastName || '';

            return {
              id: v._id || v.id || '',

              nom:
                v.fullName ||
                `${prenom} ${nom}`.trim() ||
                v.email ||
                'Bénévole',

              email: v.email || '',

              role: 'Bénévole',
            };
          });

          this.members = [
            ...beneficiaryMembers,

            ...donorMembers,

            ...volunteerMembers,
          ].filter((member) => !!member.id);

          this.totalMembers = this.members.length;
          this.notifications = this.getArray(res.notifications, ['notifications','data',]);

          const stats = res.stats?.data || res.stats || {};

          this.totalNotifications =
            stats.totalNotifications ??
            stats.total ??
            stats.notifications ??
            this.notifications.length;

          this.totalBroadcasts =
            stats.broadcasts ?? stats.totalBroadcasts ?? stats.broadcast ?? 0;
        },

        error: (error) => {
          console.error('Erreur générale:', error);
          this.errorMessage = 'Une erreur inattendue est survenue.';
        },
      });
  }

  private getArray(response: any, possibleKeys: string[]): any[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    for (const key of possibleKeys) {
      if (Array.isArray(response[key])) {
        return response[key];
      }
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && typeof response.data === 'object') {
      for (const key of possibleKeys) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }

    return [];
  }

  // ============================================================
  // FILTER MEMBERS
  // ============================================================

  get filteredMembers(): Member[] {
    const search = this.q.trim().toLowerCase();

    return this.members.filter((member) => {
      if (this.roleFilter !== 'all' && member.role !== this.roleFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        member.nom.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search)
      );
    });
  }

  // ============================================================
  // TARGET COUNT
  // ============================================================

  get targetCount(): number {
    if (this.type === 'broadcast') {
      return this.members.length;
    }

    return this.selected.length;
  }

  // ============================================================
  // VIEW
  // ============================================================

  changeView(view: ViewType): void {
    this.view = view;
  }

  // ============================================================
  // TYPE
  // ============================================================

  changeType(type: NotifType): void {
    this.type = type;

    this.selected = [];

    this.errors = {};
  }

  // ============================================================
  // SELECTION
  // ============================================================

  toggleMember(member: Member): void {
    if (this.type === 'monocast') {
      this.selected = [member.id];

      delete this.errors['selected'];

      return;
    }

    if (this.selected.includes(member.id)) {
      this.selected = this.selected.filter((id) => id !== member.id);
    } else {
      this.selected = [...this.selected, member.id];
    }

    if (this.selected.length > 0) {
      delete this.errors['selected'];
    }
  }

  isSelected(id: string): boolean {
    return this.selected.includes(id);
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  validate(): boolean {
    const errors: Record<string, string> = {};

    if (this.type === 'monocast' && this.selected.length !== 1) {
      errors['selected'] = 'Sélectionnez un membre';
    }

    if (this.type === 'multicast' && this.selected.length === 0) {
      errors['selected'] = 'Sélectionnez au moins un membre';
    }

    if (!this.titre.trim()) {
      errors['titre'] = 'Le titre est requis';
    }

    if (!this.contenu.trim()) {
      errors['contenu'] = 'Le contenu est requis';
    }

    this.errors = errors;

    return Object.keys(errors).length === 0;
  }

  // ============================================================
  // SEND
  // ============================================================

  submit(): void {
    if (!this.validate()) {
      return;
    }

    this.sending = true;

    this.errorMessage = '';

    // ========================================================
    // BROADCAST
    // ========================================================

    if (this.type === 'broadcast') {
      const notificationData = {
        titre: this.titre.trim(),

        contenu: this.contenu.trim(),
      };

      this.notificationService
        .broadcastNotification(notificationData)
        .subscribe({
          next: (response) => {
            console.log('Broadcast envoyé:', response);

            this.sendSuccess();
          },

          error: (error) => {
            console.error('Erreur broadcast:', error);

            this.errorMessage =
              error?.error?.message || 'Erreur lors de l’envoi du broadcast.';

            this.sending = false;
          },
        });

      return;
    }

    // ========================================================
    // MONOCAST
    // ========================================================

    if (this.type === 'monocast') {
      const memberId = this.selected[0];

      const notificationData = {
        titre: this.titre.trim(),

        contenu: this.contenu.trim(),

        idBeneficiaire: memberId,
      };

      this.notificationService.sendNotification(notificationData).subscribe({
        next: (response) => {
          console.log('Notification envoyée:', response);

          this.sendSuccess();
        },

        error: (error) => {
          console.error('Erreur notification:', error);

          this.errorMessage =
            error?.error?.message ||
            'Erreur lors de l’envoi de la notification.';

          this.sending = false;
        },
      });

      return;
    }

    // ========================================================
    // MULTICAST
    // ========================================================

    const requests = this.selected.map((id) => {
      const notificationData = {
        titre: this.titre.trim(),

        contenu: this.contenu.trim(),

        idBeneficiaire: id,
      };

      return this.notificationService.sendNotification(notificationData);
    });

    forkJoin(requests).subscribe({
      next: (responses) => {
        console.log('Multicast envoyé:', responses);

        this.sendSuccess();
      },

      error: (error) => {
        console.error('Erreur multicast:', error);

        this.errorMessage =
          error?.error?.message || 'Erreur lors de l’envoi des notifications.';

        this.sending = false;
      },
    });
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  private sendSuccess(): void {
    this.sending = false;

    this.sent = true;

    this.titre = '';

    this.contenu = '';

    this.selected = [];

    this.q = '';

    this.roleFilter = 'all';

    this.errors = {};

    // Recharge les vraies notifications depuis le backend
    this.loadNotifications();

    this.view = 'historique';

    setTimeout(() => {
      this.sent = false;
    }, 3500);
  }

  // ============================================================
  // RELOAD NOTIFICATIONS
  // ============================================================

  loadNotifications(): void {
    this.notificationService.getAllNotifications().subscribe({
      next: (response: any) => {
        this.notifications = this.getArray(response, ['notifications', 'data']);

        this.totalNotifications = this.notifications.length;
      },

      error: (error) => {
        console.error('Erreur reload notifications:', error);
      },
    });
  }

  // ============================================================
  // BENEFICIARY NAME
  // ============================================================

  getBeneficiaryName(notification: NotificationItem): string {
    if (!notification.idBeneficiaire) {
      return '-';
    }

    // Backend populate()
    if (typeof notification.idBeneficiaire === 'object') {
      const b = notification.idBeneficiaire;

      return (
        b.fullName ||
        `${b.Prenom || b.prenom || ''} ${b.name || b.nom || ''}`.trim() ||
        b.email ||
        'Bénéficiaire'
      );
    }

    // Only ObjectId
    const beneficiary = this.members.find(
      (member) => member.id === notification.idBeneficiaire,
    );

    return beneficiary?.nom || 'Bénéficiaire';
  }

  // ============================================================
  // BENEFICIARY EMAIL
  // ============================================================

  getBeneficiaryEmail(notification: NotificationItem): string {
    if (!notification.idBeneficiaire) {
      return '';
    }

    if (typeof notification.idBeneficiaire === 'object') {
      return notification.idBeneficiaire.email || '';
    }

    const beneficiary = this.members.find(
      (member) => member.id === notification.idBeneficiaire,
    );

    return beneficiary?.email || '';
  }

  // ============================================================
  // DATE
  // ============================================================

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
