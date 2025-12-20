import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DemandeService {

  private apiUrl = 'http://localhost:5000/api/demande'

  constructor( private http : HttpClient) { }

  Demande(formData: FormData) {
    return this.http.post(`${this.apiUrl}/demande`, formData);
  }

  verifyOtp(email: string, otp: string) {
  return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
}

  getAllDemandes(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  acceptDemande(demandeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${demandeId}/accept`, {});
  }

  rejectDemande(demandeId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${demandeId}/reject`, {});
  }


}
