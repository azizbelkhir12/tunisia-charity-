import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../services/notification/notification.service';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-voir-notifications-beneficiaire',
  templateUrl: './voir-notifications-beneficiaire.component.html',
  standalone:false,
  styleUrls: ['./voir-notifications-beneficiaire.component.css']
})
export class VoirNotificationsBeneficiaireComponent implements OnInit {
  notifications: { title: string; message: string; date: string, contenu : string }[] = [];

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (userId) {
      this.notificationService.getNotificationById(userId).subscribe({
        next: (response) => {
         
          
          if (response.success && response.notifications) {
            // Transform the API data to match your template
            this.notifications = response.notifications.map((notif: any) => ({
              title: notif.titre,  // Use 'titre' from API as 'title'
              message: notif.contenu||'No message available',  // Default since API doesn't provide
              date: new Date().toISOString()    // Default since API doesn't provide
            }));
          } else {
            this.notifications = [];
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.notifications = [];
        }
      });
    }
  }
  
}
