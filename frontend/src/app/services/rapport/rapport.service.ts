import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RapportService {

  private apiUrl = 'http://localhost:5000/api/rapport'; 
  constructor(private http : HttpClient) { }

  getRapports(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getRapports`);
  }

  ajouterRapport(rapport: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rapports`, rapport);
  }

  supprimerRapport(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteRapport/${id}`);
  }

  telechargerRapport(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/downloadRapport/${id}`, { responseType: 'blob' });
  }

  consulterRapport(id: string): Observable<Blob> {
  return this.telechargerRapport(id);
}
  
}
