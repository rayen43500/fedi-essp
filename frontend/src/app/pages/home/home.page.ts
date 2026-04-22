import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="top-nav">
      <div class="logo-container">
        <img src="/image.png" alt="Topnet Logo" class="main-logo" />
        <span class="project-name">Support Topnet</span>
      </div>
      <div class="nav-links">
        <a class="btn-text" routerLink="/login">Connexion</a>
        <a class="btn primary small" routerLink="/register">Commencer</a>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-content">
        <div class="badge-container">
          <span class="badge">Nouveau : Assistant IA Intégré</span>
        </div>
        <h1>L'excellence du support technique pour <span class="text-gradient">Topnet</span>.</h1>
        <p class="lead">
          Gérez vos incidents, suivez vos demandes et optimisez la satisfaction client avec une plateforme ITSM moderne et intelligente, conçue sur mesure.
        </p>

        <div class="cta-group">
          <a class="btn primary large" [routerLink]="primaryLink()">
            {{ primaryText() }}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </a>
          <a class="btn secondary large" routerLink="/knowledge">
            Base de connaissances
          </a>
        </div>

        <div class="stats">
          <div class="stat-item">
            <strong>24/7</strong>
            <span>Disponibilité</span>
          </div>
          <div class="stat-item">
            <strong>< 10min</strong>
            <span>Temps de réponse</span>
          </div>
          <div class="stat-item">
            <strong>100%</strong>
            <span>Cloud & Sécurisé</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="visual-wrapper">
          <div class="floating-card c1">
            <div class="icon">🎟️</div>
            <div class="text">Ticket Résolu</div>
          </div>
          <div class="floating-card c2">
            <div class="icon">🤖</div>
            <div class="text">IA Active</div>
          </div>
          <img src="/image.png" alt="Hero Illustration" class="hero-img" />
          <div class="glow"></div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="feature-card">
        <h3>Gestion de Tickets</h3>
        <p>Workflow intelligent de l'ouverture à la résolution avec suivi en temps réel.</p>
      </div>
      <div class="feature-card">
        <h3>Chatbot Intelligent</h3>
        <p>Réponses automatiques instantanées basées sur votre base de connaissances.</p>
      </div>
      <div class="feature-card">
        <h3>Dashboard Analytique</h3>
        <p>Visualisez vos performances et SLA à travers des graphiques interactifs.</p>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #fff;
      }
      .top-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 5%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
      }
      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .main-logo {
        height: 40px;
        width: auto;
      }
      .project-name {
        font-family: 'Sora', sans-serif;
        font-weight: 800;
        font-size: 1.25rem;
        color: var(--brand-blue);
      }
      .nav-links {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .btn-text {
        text-decoration: none;
        color: var(--text-secondary);
        font-weight: 600;
        transition: color 0.2s;
      }
      .btn-text:hover {
        color: var(--brand-blue);
      }

      .hero {
        padding: 120px 5% 60px;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 4rem;
        align-items: center;
        max-width: 1400px;
        margin: 0 auto;
      }
      .hero-content {
        z-index: 1;
      }
      .badge-container {
        margin-bottom: 1.5rem;
      }
      .badge {
        background: var(--brand-orange-light);
        color: var(--brand-orange);
        padding: 0.5rem 1rem;
        border-radius: 100px;
        font-size: 0.85rem;
        font-weight: 700;
        border: 1px solid rgba(243, 112, 33, 0.2);
      }
      h1 {
        font-size: clamp(2.5rem, 5vw, 4.5rem);
        line-height: 1.1;
        margin-bottom: 1.5rem;
        color: #0f172a;
      }
      .text-gradient {
        background: linear-gradient(90deg, var(--brand-blue), var(--brand-orange));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .lead {
        font-size: 1.25rem;
        color: var(--text-secondary);
        margin-bottom: 2.5rem;
        max-width: 600px;
      }
      .cta-group {
        display: flex;
        gap: 1rem;
        margin-bottom: 3rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .btn.primary {
        background: var(--brand-blue);
        color: white;
        box-shadow: 0 10px 15px -3px rgba(0, 89, 163, 0.3);
      }
      .btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 89, 163, 0.4);
      }
      .btn.secondary {
        background: white;
        color: var(--brand-blue);
        border: 2px solid var(--brand-blue-light);
      }
      .btn.secondary:hover {
        background: var(--brand-blue-light);
      }
      .btn.small { padding: 0.5rem 1.25rem; font-size: 0.9rem; }
      .btn.large { padding: 1rem 2rem; font-size: 1.1rem; }

      .stats {
        display: flex;
        gap: 3rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 2rem;
      }
      .stat-item {
        display: flex;
        flex-direction: column;
      }
      .stat-item strong {
        font-size: 1.5rem;
        color: var(--brand-blue);
        font-family: 'Sora', sans-serif;
      }
      .stat-item span {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .hero-visual {
        position: relative;
        display: flex;
        justify-content: center;
      }
      .visual-wrapper {
        position: relative;
        width: 100%;
        max-width: 500px;
      }
      .hero-img {
        width: 100%;
        height: auto;
        border-radius: 24px;
        position: relative;
        z-index: 2;
      }
      .glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        background: radial-gradient(circle, rgba(0, 89, 163, 0.15), transparent 70%);
        z-index: 1;
      }
      .floating-card {
        position: absolute;
        background: white;
        padding: 1rem;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 3;
        animation: float 4s ease-in-out infinite;
      }
      .floating-card .icon { font-size: 1.5rem; }
      .floating-card .text { font-weight: 700; color: #1e293b; }
      .c1 { top: 10%; right: -5%; animation-delay: 0s; }
      .c2 { bottom: 20%; left: -10%; animation-delay: 2s; }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }

      .features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        padding: 80px 5%;
        max-width: 1400px;
        margin: 0 auto;
      }
      .feature-card {
        padding: 2rem;
        border-radius: 20px;
        background: var(--brand-blue-light);
        transition: transform 0.3s;
      }
      .feature-card:hover {
        transform: translateY(-5px);
      }
      .feature-card h3 {
        color: var(--brand-blue);
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }
      .feature-card p {
        color: var(--text-secondary);
      }

      @media (max-width: 1024px) {
        .hero { grid-template-columns: 1fr; text-align: center; }
        .hero-content { display: flex; flex-direction: column; align-items: center; }
        .lead { margin-left: auto; margin-right: auto; }
        .cta-group { justify-content: center; }
        .stats { justify-content: center; }
        .features { grid-template-columns: 1fr; }
      }
    `
  ]
})
export class HomePage {
  readonly primaryLink = computed(() => (this.auth.isAuthenticated() ? '/app/dashboard' : '/login'));
  readonly primaryText = computed(() => (this.auth.isAuthenticated() ? 'Accéder à mon espace' : 'Démarrer maintenant'));

  constructor(private readonly auth: AuthService) {}
}
