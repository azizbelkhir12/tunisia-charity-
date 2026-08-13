import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

interface AdminNavigationItem {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar-admin',
  templateUrl: './sidebar-admin.component.html',
  standalone:false,
  styleUrls: ['./sidebar-admin.component.css'],
})
export class SidebarAdminComponent implements OnInit {
   readonly navigationItems: AdminNavigationItem[] = [
    {
      to: '/admin-compte',
      label: "Vue d'ensemble",
      icon: 'layout-dashboard',
      exact: true,
    },
    {
      to: '/admin-compte/gestion-des-dons',
      label: 'Donateurs',
      icon: 'hand-heart',
    },
    {
      to: '/admin-compte/gestion-benevoles',
      label: 'Bénévoles',
      icon: 'users',
    },
    {
      to: '/admin-compte/gestion-beneficiaires',
      label: 'Bénéficiaires',
      icon: 'HeartHandshake',
    },
    {
      to: '/admin-compte/gestion-des-projets',
      label: 'Projets',
      icon: 'folder-kanban',
    },
    {
      to: '/admin-compte/gestion-des-rapports',
      label: 'Rapports',
      icon: 'file-text',
    },
    {
      to: '/admin-compte/gestion-notification',
      label: "notifications",
      icon: 'bell',
      exact: true,
    },
    {
      to: '/admin-compte/gestion-feedback',
      label: 'Feedback',
      icon: 'MessageSquare',
    },
  ];

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Admin — Tunisia Charity');

    this.metaService.updateTag({
      name: 'robots',
      content: 'noindex',
    });
  }

  logout(): void {
    // Supprimer les données d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');

    // Au cas où certaines données seraient dans sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');

    // Redirection vers le site
    this.router.navigate(['/']);
  }

}
  



