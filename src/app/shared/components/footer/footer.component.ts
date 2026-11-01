import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentService } from '../../../core/services/content.service';
import { SocialIconComponent } from '../social-icon/social-icon.component';
import { SubscribeFormComponent } from '../forms/subscribe-form.component';
import { LogoMarkComponent } from '../logo-mark/logo-mark.component';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SocialIconComponent, SubscribeFormComponent, LogoMarkComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly content = inject(ContentService);

  readonly year = new Date().getFullYear();

  readonly settings = computed(() => this.content.site.value()?.settings);
  readonly logo = computed(() => this.content.site.value()?.settings?.logo ?? null);
  readonly socials = computed(() => this.content.site.value()?.socials ?? []);
  readonly services = computed(() => this.content.servicesList().slice(0, 6));

  readonly navItems = [
    { label: 'Главная', path: '/' },
    { label: 'Услуги', path: '/services' },
    { label: 'Проекты', path: '/projects' },
    { label: 'Обо мне', path: '/about' },
    { label: 'Блог', path: '/blog' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Контакты', path: '/contact' },
  ];
}
