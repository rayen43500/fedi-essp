import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${this.resolveApiBase()}/auth`;
  private readonly tokenKey = 'support_token';
  private readonly userKey = 'support_user';

  readonly currentUser = signal<UserSummary | null>(this.readUser());
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  register(payload: { fullName: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.api}/register`, payload).pipe(
      tap((res) => this.storeAuth(res))
    );
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.api}/login`, payload).pipe(
      tap((res) => this.storeAuth(res))
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) {
      return false;
    }
    return user.roles.some((r) => roles.includes(r));
  }

  updateCurrentUser(user: UserSummary): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  mediaUrl(path?: string | null): string {
    if (!path) {
      return '';
    }
    if (path.startsWith('http')) {
      return path;
    }
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? `http://localhost:8080${path}` : path;
  }

  private storeAuth(response: AuthResponse) {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private readUser(): UserSummary | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserSummary;
    } catch {
      return null;
    }
  }

  private resolveApiBase(): string {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:8086/api' : '/api';
  }
}
