import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { KnowledgeArticle } from '../../core/models';

@Component({
  selector: 'app-knowledge-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section>
      <h2>Base de connaissances (FAQ)</h2>

      <div class="toolbar">
        <input placeholder="Rechercher un article" [value]="query()" (input)="onSearch($any($event.target).value)" />
      </div>

      <form [formGroup]="form" (ngSubmit)="create()" class="create-form">
        <input formControlName="title" placeholder="Titre" />
        <input formControlName="category" placeholder="Categorie" />
        <textarea formControlName="content" rows="3" placeholder="Contenu"></textarea>
        <button type="submit" [disabled]="form.invalid">Ajouter article</button>
      </form>

      <div class="articles">
        <article *ngFor="let item of articles()">
          <h3>{{ item.title }}</h3>
          <p>{{ item.content }}</p>
          <small>{{ item.category }} | {{ item.authorName }}</small>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .toolbar input, .create-form input, .create-form textarea {
        width: 100%;
        border: 1px solid #c8d3de;
        border-radius: 10px;
        padding: 0.7rem;
      }
      .create-form {
        margin-top: 1rem;
        display: grid;
        gap: 0.6rem;
        background: #fff;
        border-radius: 14px;
        padding: 1rem;
      }
      button {
        width: fit-content;
        border: 0;
        background: #0f766e;
        color: #fff;
        border-radius: 8px;
        padding: 0.55rem 0.8rem;
      }
      .articles {
        margin-top: 1rem;
        display: grid;
        gap: 0.8rem;
      }
      article {
        background: #fff;
        border-radius: 14px;
        padding: 1rem;
        box-shadow: 0 8px 18px rgba(8, 24, 40, 0.08);
      }
      small { color: #5b6777; }
    `
  ]
})
export class KnowledgePage implements OnInit {
  readonly articles = signal<KnowledgeArticle[]>([]);
  readonly query = signal('');

  readonly form;

  constructor(private readonly api: ApiService, private readonly fb: FormBuilder) {
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
    this.api.knowledge(this.query()).subscribe((res) => this.articles.set(res));
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
      this.load();
    });
  }
}
