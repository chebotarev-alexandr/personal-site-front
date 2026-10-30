import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ContentService } from '../../../core/services/content.service';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

interface NavItem {
  label: string;
  path: string;
}

type Theme = 'dark' | 'light';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LogoMarkComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly content = inject(ContentService);

  readonly menuOpen = signal(false);
  readonly theme = signal<Theme>('dark');

  readonly navItems: NavItem[] = [
    { label: 'Главная', path: '/' },
    { label: 'Услуги', path: '/services' },
    { label: 'Проекты', path: '/projects' },
    { label: 'Обо мне', path: '/about' },
    { label: 'Блог', path: '/blog' },
    { label: 'FAQ', path: '/faq' },
  ];

  readonly siteName = computed(() => this.content.site.value()?.settings?.site_name ?? '…');
  readonly logo = computed(() => this.content.site.value()?.settings?.logo ?? null);

  constructor() {
    afterNextRender(() => {
      this.theme.set(this.readTheme());
    });
  }

  toggle(): void {
    this.menuOpen.update((v) => !v);
  }

  close(): void {
    this.menuOpen.set(false);
  }

  toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.dataset['theme'] = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage может быть недоступен (приватный режим) — не критично
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', next === 'dark' ? '#070b14' : '#f6f8fc');
    }
  }

  private readTheme(): Theme {
    return document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark';
  }
}
