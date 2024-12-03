import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private messageService: MessageService) { }

  // Méthode pour afficher une notification de succès
  success(summary: string, detail: string): void {
    this.messageService.add({ severity: 'success', summary, detail });
  }

// Méthode pour afficher une notification d'information
  info(summary: string, detail: string): void {
    this.messageService.add({ severity: 'info', summary, detail });
  }

// Méthode pour afficher une notification d'avertissement
  warn(summary: string, detail: string): void {
    this.messageService.add({ severity: 'warn', summary, detail });
  }

// Méthode pour afficher une notification d'erreur
  error(summary: string, detail: string): void {
    this.messageService.add({ severity: 'error', summary, detail });
  }

// Méthode pour effacer toutes les notifications
  clear(): void {
    this.messageService.clear();
  }

}
