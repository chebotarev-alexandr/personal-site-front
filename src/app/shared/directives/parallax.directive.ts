import { afterNextRender, Directive, ElementRef, Input, NgZone, OnDestroy, inject } from '@angular/core';

/**
 * Параллакс на скролле: элемент сдвигается на долю прокрутки.
 * Положительный speed — элемент «отстаёт» (движется медленнее контента),
 * отрицательный — «обгоняет». Уважает prefers-reduced-motion.
 */
@Directive({ selector: '[appParallax]', standalone: true })
export class ParallaxDirective implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  @Input('appParallax') speed = 0.2;

  private ticking = false;
  private cleanup?: () => void;

  constructor() {
    afterNextRender(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      this.zone.runOutsideAngular(() => {
        window.addEventListener('scroll', this.onScroll, { passive: true });
        this.cleanup = () => window.removeEventListener('scroll', this.onScroll);
        this.onScroll();
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }

  private onScroll = (): void => {
    if (this.ticking) {
      return;
    }
    this.ticking = true;
    requestAnimationFrame(() => {
      this.ticking = false;
      this.el.style.transform = `translate3d(0, ${window.scrollY * this.speed}px, 0)`;
    });
  };
}
