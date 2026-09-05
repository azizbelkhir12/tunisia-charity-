import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = 'http://localhost:5000/api/notifications';
  constructor(private http: HttpClient) {}

  sendNotification(notificationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, notificationData);
  }

  broadcastNotification(notificationData: { titre: string; contenu: string }) {
    return this.http.post<any>(`${this.apiUrl}/sendmultiple`, notificationData);
  }

  getNotificationById(Id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getNotifications/${Id}`);
  }

  getNotificationStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getAllNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getall`);
  }

  markAllNotificationsAsRead(beneficiaryId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${beneficiaryId}/read-all`, {});
  }

  sendEmailNotification(email: string,broadcast: boolean = false,): Observable<any> {
    return this.http.post(`${this.apiUrl}/emailBeneficiary`, {email, broadcast, });
  }
}
