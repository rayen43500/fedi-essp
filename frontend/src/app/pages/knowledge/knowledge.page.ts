import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { KnowledgeArticle } from '../../core/models';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-knowledge-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="knowledge-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Guides et réponses</p>
          <h1>Base de connaissances</h1>
          <p class="subtitle">Retrouvez les solutions utiles sans fouiller dans les tickets.</p>
        </div>
        <div class="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Rechercher un guide..." [value]="query()" (input)="onSearch($any($event.target).value)" />
        </div>
      </div>

      <div class="admin-panel" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])">
        <button class="toggle-btn" type="button" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Fermer le formulaire' : 'Ajouter un article' }}
        </button>

        <form [formGroup]="form" (ngSubmit)="create()" class="create-form" *ngIf="showForm()">
          <div>
            <h2>Nouvel article</h2>
            <p>Rédigez une réponse claire, courte et directement actionnable.</p>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="article-title">Titre</label>
              <input id="article-title" formControlName="title" placeholder="Ex. Connexion réseau instable" />
            </div>
            <div class="field">
              <label for="article-category">Catégorie</label>
              <input id="article-category" formControlName="category" placeholder="Réseau, Accès, Email..." />
            </div>
          </div>
          <div class="field">
            <label for="article-content">Contenu</label>
            <textarea id="article-content" formControlName="content" rows="5" placeholder="Expliquez les étapes de résolution avec des phrases simples."></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" [disabled]="form.invalid || saving()" class="btn-primary">
              {{ saving() ? 'Publication...' : "Publier l'article" }}
            </button>
          </div>
        </form>
      </div>

      <p class="notice" *ngIf="notice()">{{ notice() }}</p>
      <p class="error" *ngIf="error()">{{ error() }}</p>

      <div class="articles-grid">
        <article class="article-card" *ngFor="let item of articles()">
          <div class="article-category">{{ item.category }}</div>
          <h2>{{ item.title }}</h2>
          <p [class.clamped]="expandedArticleId() !== item.id">{{ item.content }}</p>
          <div class="article-footer">
            <div class="author">
              <div class="avatar">{{ item.authorName.charAt(0) }}</div>
              <span>{{ item.authorName }}</span>
            </div>
            <button type="button" class="read-more" (click)="toggleArticle(item.id)">
              {{ expandedArticleId() === item.id ? 'Réduire' : 'Lire la suite' }}
            </button>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="articles().length === 0">
        <strong>Aucun article trouvé.</strong>
        <p>Essayez un autre mot-clé ou créez un nouvel article si vous êtes agent.</p>
      </div>
    </section>
  `,
  styles: [
    `
      .knowledge-page {
        max-width: 1120px;
        margin: 0 auto;
        display: grid;
        gap: 1.6rem;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 1.5rem;
      }

      .eyebrow {
        color: var(--brand-orange-dark);
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.4rem;
      }

      h1 {
        font-size: 2.2rem;
        line-height: 1.15;
      }

      .subtitle {
        color: var(--text-secondary);
        margin-top: 0.5rem;
      }

      .search-bar {
        position: relative;
        width: min(420px, 100%);
      }

      .search-icon {
        position: absolute;
        left: 0.95rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }

      .search-bar input,
      .create-form input,
      .create-form textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: #fff;
        padding: 0.78rem 0.95rem;
        color: var(--text-primary);
      }

      .search-bar input {
        padding-left: 2.75rem;
      }

      .search-bar input:focus,
      .create-form input:focus,
      .create-form textarea:focus {
        outline: none;
        border-color: var(--brand-blue);
        box-shadow: 0 0 0 4px rgba(0, 89, 163, 0.10);
      }

      .admin-panel {
        display: grid;
        gap: 1rem;
        justify-items: start;
      }

      .toggle-btn,
      .btn-primary,
      .read-more {
        border-radius: var(--radius-md);
        font-weight: 900;
        cursor: pointer;
      }

      .toggle-btn {
        border: 1px solid var(--line);
        background: #fff;
        color: var(--brand-blue);
        padding: 0.65rem 0.95rem;
      }

      .create-form,
      .article-card,
      .empty-state {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
      }

      .create-form {
        width: 100%;
        padding: 1.25rem;
        display: grid;
        gap: 1rem;
      }

      .create-form h2 {
        font-size: 1.2rem;
      }

      .create-form p {
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1.4fr 0.8fr;
        gap: 1rem;
      }

      .field {
        display: grid;
        gap: 0.45rem;
      }

      .field label {
        font-size: 0.86rem;
        font-weight: 900;
      }

      .create-form textarea {
        resize: vertical;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
      }

      .btn-primary {
        min-height: 40px;
        border: 0;
        background: var(--brand-blue);
        color: #fff;
        padding: 0.68rem 1rem;
      }

      .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .notice,
      .error {
        border-radius: var(--radius-md);
        padding: 0.85rem 1rem;
        font-weight: 800;
      }

      .notice {
        background: var(--success-soft);
        color: var(--success);
        border: 1px solid rgba(24, 135, 84, 0.22);
      }

      .error {
        background: var(--danger-soft);
        color: var(--danger);
        border: 1px solid rgba(194, 65, 61, 0.22);
      }

      .articles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .article-card {
        padding: 1.2rem;
        display: flex;
        flex-direction: column;
      }

      .article-category {
        width: fit-content;
        padding: 0.25rem 0.55rem;
        background: var(--brand-blue-soft);
        color: var(--brand-blue);
        border-radius: var(--radius-sm);
        font-size: 0.72rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.85rem;
      }

      .article-card h2 {
        font-size: 1.12rem;
        line-height: 1.35;
        margin-bottom: 0.7rem;
      }

      .article-card p {
        color: var(--text-secondary);
        line-height: 1.6;
        flex: 1;
        white-space: pre-line;
      }

      .article-card p.clamped {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .article-footer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8rem;
      }

      .author {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        min-width: 0;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        background: var(--surface-soft);
        color: var(--brand-blue);
        display: grid;
        place-items: center;
        font-weight: 900;
      }

      .author span {
        color: var(--text-secondary);
        font-size: 0.86rem;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .read-more {
        flex: 0 0 auto;
        border: 1px solid var(--line);
        background: var(--surface-soft);
        color: var(--brand-blue);
        padding: 0.48rem 0.7rem;
      }

      .empty-state {
        padding: 1.4rem;
      }

      .empty-state p {
        color: var(--text-secondary);
        margin-top: 0.35rem;
      }

      @media (max-width: 760px) {
        .page-header,
        .form-row {
          display: grid;
        }

        h1 {
          font-size: 1.8rem;
        }

        .search-bar {
          width: 100%;
        }
      }
    `
  ]
})
export class KnowledgePage implements OnInit {
  readonly articles = signal<KnowledgeArticle[]>([]);
  readonly query = signal('');
  readonly showForm = signal(false);
  readonly expandedArticleId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly notice = signal('');
  readonly error = signal('');

  readonly form;

  constructor(
    private readonly api: ApiService,
    private readonly fb: FormBuilder,
    readonly auth: AuthService
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.knowledge(this.query()).subscribe({
      next: (res: KnowledgeArticle[]) => this.articles.set(res),
      error: () => this.error.set('Impossible de charger les articles.')
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.load();
  }

  toggleArticle(id: number): void {
    this.expandedArticleId.update((current) => (current === id ? null : id));
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.notice.set('');

    this.api.createKnowledge(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set('Article publié.');
        this.form.reset();
        this.showForm.set(false);
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set("L'article n'a pas pu être publié.");
      }
    });
  }
}
