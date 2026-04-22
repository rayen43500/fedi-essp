import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { UserSummary } from '../../core/models';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section>
      <h2>Utilisateurs et roles</h2>
      <div class="list">
        <article *ngFor="let user of users()">
          <div>
            <h3>{{ user.fullName }}</h3>
            <p>{{ user.email }}</p>
            <small>Roles: {{ user.roles.join(', ') }}</small>
          </div>
          <button (click)="toggle(user)">{{ user.active ? 'Desactiver' : 'Activer' }}</button>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .list {
        margin-top: 1rem;
        display: grid;
        gap: 0.8rem;
      }
      article {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        background: #fff;
        border-radius: 14px;
        padding: 1rem;
        box-shadow: 0 8px 18px rgba(8, 24, 40, 0.08);
      }
      h3 { margin: 0; }
      p { margin: 0.2rem 0; color: #4f5f6f; }
      button {
        border: 0;
        background: #7a1f1f;
        color: #fff;
        border-radius: 8px;
        padding: 0.55rem 0.8rem;
      }
      @media (max-width: 780px) {
        article { flex-direction: column; align-items: flex-start; }
      }
    `
  ]
})
export class UsersPage implements OnInit {
  readonly users = signal<UserSummary[]>([]);

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.api.users().subscribe((res) => this.users.set(res));
  }

  toggle(user: UserSummary) {
    this.api.setUserActive(user.id, !user.active).subscribe(() => this.load());
  }
}
