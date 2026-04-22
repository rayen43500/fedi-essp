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
        <div class="header-content">
          <h1>Base de connaissances</h1>
          <p class="subtitle">Trouvez des réponses rapides à vos questions techniques.</p>
        </div>
        <div class="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Rechercher un guide ou un article..." [value]="query()" (input)="onSearch($any($event.target).value)" />
        </div>
      </div>

      <!-- Create form: Only for Admin/Agent -->
      <div class="admin-panel" *ngIf="auth.hasAnyRole(['ADMIN', 'AGENT', 'SUPERVISEUR'])">
        <button class="toggle-btn" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Annuler' : 'Ajouter un nouvel article' }}
        </button>

        <form [formGroup]="form" (ngSubmit)="create()" class="create-form" *ngIf="showForm()">
          <h3>Nouvel Article</h3>
          <div class="form-row">
            <input formControlName="title" placeholder="Titre de l'article" />
            <input formControlName="category" placeholder="Catégorie (ex: Réseau, Email...)" />
          </div>
          <textarea formControlName="content" rows="4" placeholder="Contenu de l'article (Markdown supporté)"></textarea>
          <div class="form-actions">
            <button type="submit" [disabled]="form.invalid" class="btn-primary">Publier l'article</button>
          </div>
        </form>
      </div>

      <div class="articles-grid">
        <article class="article-card" *ngFor="let item of articles()">
          <div class="article-category">{{ item.category }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.content }}</p>
          <div class="article-footer">
            <div class="author">
              <div class="avatar">{{ item.authorName.charAt(0) }}</div>
              <span>Par {{ item.authorName }}</span>
            </div>
            <button class="read-more">Lire la suite →</button>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="articles().length === 0">
        <div class="icon">🔍</div>
        <p>Aucun article ne correspond à votre recherche.</p>
      </div>
    </section>
  `,
  styles: [
    `
      .knowledge-page { max-width: 1100px; margin: 0 auto; display: grid; gap: 2.5rem; }
      
      .page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem; flex-wrap: wrap; }
      .header-content h1 { font-size: 2.2rem; color: #0f172a; margin-bottom: 0.5rem; }
      .header-content .subtitle { color: #64748b; font-size: 1.1rem; }

      .search-bar {
        position: relative;
        flex: 1;
        max-width: 400px;
      }
      .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
      .search-bar input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 3rem;
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        font-size: 1rem;
        transition: all 0.2s;
        background: #fff;
      }
      .search-bar input:focus { outline: none; border-color: var(--brand-blue); box-shadow: 0 0 0 4px var(--brand-blue-light); }

      .admin-panel { margin-bottom: 1rem; }
      .toggle-btn {
        background: #f1f5f9;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        padding: 0.6rem 1.25rem;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }
      .toggle-btn:hover { background: #e2e8f0; }

      .create-form {
        margin-top: 1.5rem;
        display: grid;
        gap: 1rem;
        background: #fff;
        border-radius: 20px;
        padding: 2rem;
        border: 1px solid #f1f5f9;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      }
      .create-form h3 { margin-bottom: 1rem; color: #1e293b; }
      .form-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem; }
      .create-form input, .create-form textarea {
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        font-family: inherit;
      }
      .create-form input:focus, .create-form textarea:focus { outline: none; border-color: var(--brand-blue); }
      .btn-primary {
        background: var(--brand-blue);
        color: #fff;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }

      .articles-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;
      }
      .article-card {
        background: #fff;
        padding: 2rem;
        border-radius: 24px;
        border: 1px solid #f1f5f9;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
      }
      .article-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
        border-color: var(--brand-blue-light);
      }
      .article-category {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background: var(--brand-blue-light);
        color: var(--brand-blue);
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 1rem;
        width: fit-content;
      }
      .article-card h3 { font-size: 1.3rem; color: #1e293b; margin-bottom: 1rem; line-height: 1.3; }
      .article-card p { color: #64748b; line-height: 1.6; font-size: 0.95rem; margin-bottom: 2rem; flex: 1; }
      
      .article-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
      .author { display: flex; align-items: center; gap: 0.75rem; }
      .avatar { width: 32px; height: 32px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; color: #64748b; }
      .author span { font-size: 0.85rem; color: #64748b; font-weight: 600; }
      .read-more { background: none; border: none; color: var(--brand-blue); font-weight: 700; cursor: pointer; font-size: 0.9rem; }

      .empty-state { text-align: center; padding: 4rem 2rem; }
      .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; }
      .empty-state p { color: #64748b; font-size: 1.1rem; }

      @media (max-width: 640px) {
        .form-row { grid-template-columns: 1fr; }
        .page-header { flex-direction: column; align-items: flex-start; }
        .search-bar { max-width: 100%; }
      }
    `
  ]
})
export class KnowledgePage implements OnInit {
  readonly articles = signal<KnowledgeArticle[]>([]);
  readonly query = signal('');
  readonly showForm = signal(false);

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

  load() {
    this.api.knowledge(this.query()).subscribe((res: KnowledgeArticle[]) => this.articles.set(res));
  }

  onSearch(value: string) {
    this.query.set(value);
    this.load();
  }

  create() {
    if (this.form.invalid) {
      return;
    }

    this.api.createKnowledge(this.form.getRawValue() as any).subscribe(() => {
      this.form.reset();
      this.showForm.set(false);
      this.load();
    });
  }
}
