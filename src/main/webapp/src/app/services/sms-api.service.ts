import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SmsForm {
  userName: string;
  callingCode: string;
  phoneNumber: string;
  content: string;
}

export interface SmsPackForm {
  companyName: string;
  totalSms: number;
}

export interface SmsJob {
  id: number;
  userName: string;
  callingCode: string;
  phoneNumber: string;
  content: string;
  sendState: 'WAITING' | 'SEND' | 'CANCELLED' | 'ERROR';
  tryCount: number;
  requestDate: Date;
  sendDate?: Date;
}

export interface SendSmsResponse {
  message: string;
  smsJob: SmsJob;
}

export interface SmsPack {
  id: number;
  companyName: string;
  totalSms: number;
  purchaseDate: Date;
}

export interface SmsStatistics {
  totalPurchasedSms: number;
  totalSentSms: number;
  smsAvailable: number;
}

export interface RemainingSmsResponse {
  remainingSms: number;
}

export interface CancelSmsResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SmsApiService {
  private readonly baseUrl = '/api/sms';

  constructor(private http: HttpClient) {}

  // 1. Envoyer un SMS
  sendSms(smsForm: SmsForm): Observable<SendSmsResponse> {
    const headers = { 'Content-Type': 'application/json; charset=UTF-8' };
    return this.http.post<SendSmsResponse>(`${this.baseUrl}/send`, smsForm, { headers });
  }

  // 2. Acheter un pack de SMS
  buySmsPack(packForm: SmsPackForm): Observable<SmsPack> {
    return this.http.post<SmsPack>(`${this.baseUrl}/buy-pack`, packForm);
  }

  // 3. Récupérer le nombre de SMS restants
  getRemainingSms(): Observable<RemainingSmsResponse> {
    return this.http.get<RemainingSmsResponse>(`${this.baseUrl}/remaining`);
  }

  // 4. Récupérer un SMS par ID
  getSmsById(id: number): Observable<SmsJob> {
    return this.http.get<SmsJob>(`${this.baseUrl}/${id}`);
  }

  // 5. Récupérer les SMS d'un utilisateur
  getSmsByUserName(userName: string): Observable<SmsJob[]> {
    const params = { user: userName };
    return this.http.get<SmsJob[]>(`${this.baseUrl}/user`, { params });
  }

  // 6. Récupérer le nombre total de SMS
  countAllSms(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`);
  }

  // 7. Récupérer tous les SMS
  getAllSms(): Observable<SmsJob[]> {
    return this.http.get<SmsJob[]>(`${this.baseUrl}/all`);
  }

  // 8. Annuler un SMS
  cancelSms(id: number): Observable<CancelSmsResponse> {
    return this.http.put<CancelSmsResponse>(`${this.baseUrl}/${id}/cancel`, {});
  }

  // 9. Récupérer les statistiques des SMS
  getSmsStatistics(): Observable<SmsStatistics> {
    return this.http.get<SmsStatistics>(`${this.baseUrl}/statistics`);
  }
}
