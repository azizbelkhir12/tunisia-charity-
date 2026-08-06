import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  private apiUrl = 'http://localhost:5000/api/donations'; 

  constructor(private http: HttpClient) { }

  createDonation(data: any): Observable<any> {
    if (!data.amount || !data.paymentMethod) {
      throw new Error('Missing required donation fields');
    }

    // For credit card payments, ensure paymentId exists
    if (data.paymentMethod === 'credit_card' && !data.paymentId) {
      throw new Error('Payment verification required for credit card donations');
    }

    const payload = {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentType: "local",
      guestName: data.guestName || null,
      guestEmail: data.guestEmail || null,
      paymentId: data.paymentId || null,
      project: data.project  ,
      status: data.status || 'completed'
    };

    return this.http.post(`${this.apiUrl}/createDon`, payload);
  }


  getDonations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAllDonations`);
  }
}