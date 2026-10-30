import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContentService } from '../../core/services/content.service';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';
import { CtaComponent } from '../../shared/components/cta/cta.component';
import { TypewriterComponent } from '../../shared/components/typewriter/typewriter.component';
import { ServiceCardComponent } from '../../shared/components/service-card/service-card.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { TestimonialCarouselComponent } from '../../shared/components/testimonial-carousel/testimonial-carousel.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { ParallaxDirective } from '../../shared/directives/parallax.directive';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SectionHeadingComponent,
    CtaComponent,
    TypewriterComponent,
    ServiceCardComponent,
    ProjectCardComponent,
    TestimonialCarouselComponent,
    RevealDirective,
    ParallaxDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly content = inject(ContentService);

  readonly hero = computed(() => this.content.site.value()?.hero);
  readonly stats = computed(() => this.content.site.value()?.stats ?? []);
  readonly services = computed(() => this.content.featuredServices());
  readonly projects = computed(() => this.content.featuredProjects());
  readonly process = computed(() => this.content.process.value() ?? []);
  readonly testimonials = computed(() => this.content.testimonials.value() ?? []);

  isInternal(url: string | undefined): boolean {
    return !!url && url.startsWith('/');
  }
}
