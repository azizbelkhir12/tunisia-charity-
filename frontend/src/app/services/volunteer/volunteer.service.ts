import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VolunteerService {

  private apiUrl = 'http://localhost:5000/api/volunteers';

  constructor(private http : HttpClient) { }

  getVolunteers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/volunteers`);
  }

  changeVolunteerStatus(id: string, status: 'active' | 'inactive') {
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }
  
  getVolunteerById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getvolunteers/${id}`);
  }

  uploadPhoto(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('photo', file);
    
    // Clean ID if it contains any file extensions
    const cleanId = id.replace(/\..+$/, '');
    
    return this.http.put(`${this.apiUrl}/photo/${cleanId}`, formData, {
      reportProgress: true
    });
  }

  updateVolunteer(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, data);
  }

  updateVolunteerByAdmin(id: string, data: any) {
  return this.http.put(`${this.apiUrl}/admin-volunteer/${id}`, data);
}

}
