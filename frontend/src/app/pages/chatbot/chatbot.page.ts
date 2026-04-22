import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ChatbotReply } from '../../core/models';

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section>
      <h2>Assistant intelligent</h2>
      <p>Posez une question avant de creer un ticket.</p>

      <div class="chatbox">
        <textarea [(ngModel)]="question" rows="3" placeholder="Ex: Je n'arrive pas a me connecter au VPN"></textarea>
        <button (click)="ask()" [disabled]="!question.trim()">Interroger le chatbot</button>
      </div>

      <article *ngIf="reply() as r" class="result">
        <h3>Reponse</h3>
        <p>{{ r.answer }}</p>

        <div *ngIf="r.suggestions.length">
          <h4>Suggestions FAQ</h4>
          <ul>
            <li *ngFor="let s of r.suggestions">
              <strong>{{ s.title }}</strong>
              <p>{{ s.content }}</p>
            </li>
          </ul>
        </div>
      </article>
    </section>
  `,
  styles: [
    `
      .chatbox {
        display: grid;
        gap: 0.7rem;
        margin-top: 1rem;
      }
      textarea {
        border: 1px solid #c8d3de;
        border-radius: 10px;
        padding: 0.7rem;
      }
      button {
        width: fit-content;
        border: 0;
        background: #0b4a6b;
        color: #fff;
        border-radius: 8px;
        padding: 0.55rem 0.8rem;
      }
      .result {
        margin-top: 1rem;
        background: #fff;
        border-radius: 14px;
        padding: 1rem;
        box-shadow: 0 8px 18px rgba(8, 24, 40, 0.08);
      }
      ul { padding-left: 1.1rem; }
      li { margin-bottom: 0.8rem; }
      li p { margin: 0.2rem 0 0; color: #4f5f6f; }
    `
  ]
})
export class ChatbotPage {
  question = '';
  readonly reply = signal<ChatbotReply | null>(null);

  constructor(private readonly api: ApiService) {}

  ask() {
    this.api.chatbot(this.question).subscribe((res) => this.reply.set(res));
  }
}
