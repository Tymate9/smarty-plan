import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  template: `
    <div class="admin-page">
      <h1>Page d'Administration</h1>
      <p>{{ message }}</p>
    </div>
  `,
  standalone: true,
  styles: []
})
export class AdminComponent implements OnInit {
  message: string = '';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get('http://localhost:8080/api/admin', { responseType: 'text' })
      .subscribe(
        data => this.message = data,
        error => this.message = 'Erreur lors de la récupération des données'
      );
  }
}
