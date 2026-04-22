import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { TicketsPage } from './pages/tickets/tickets.page';
import { KnowledgePage } from './pages/knowledge/knowledge.page';
import { ChatbotPage } from './pages/chatbot/chatbot.page';
import { UsersPage } from './pages/users/users.page';
import { ShellComponent } from './shared/shell.component';

export const routes: Routes = [
	{ path: '', component: HomePage },
	{ path: 'login', component: LoginPage },
	{ path: 'register', component: RegisterPage },
	{
		path: 'app',
		component: ShellComponent,
		canActivate: [authGuard],
		children: [
			{ path: 'dashboard', component: DashboardPage },
			{ path: 'tickets', component: TicketsPage },
			{ path: 'knowledge', component: KnowledgePage },
			{ path: 'chatbot', component: ChatbotPage },
			{
				path: 'users',
				component: UsersPage,
				canActivate: [roleGuard(['ADMIN', 'SUPERVISEUR'])]
			},
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' }
		]
	},
	{ path: '**', redirectTo: '' }
];
