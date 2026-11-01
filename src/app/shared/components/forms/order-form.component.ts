import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LeadService } from '../../../core/services/lead.service';
import { ContentService } from '../../../core/services/content.service';
import type { OrderPayload } from '../../../core/models/models';
import { phoneValidator } from '../../validators';
import { LeadFormBase } from './lead-form.base';

@Component({
  selector: 'app-order-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      @if (success()) {
        <div class="form-success" role="status">
          <strong>Заявка отправлена!</strong> Свяжусь с вами, чтобы обсудить детали.
        </div>
      } @else {
        <div class="form-grid">
          <div class="field">
            <label class="label" for="o-name">Имя *</label>
            <input class="input" id="o-name" type="text" formControlName="name" placeholder="Как к вам обращаться" autocomplete="name" />
            @if (error('name')) {
              <span class="field-error">{{ error('name') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="o-phone">Телефон *</label>
            <input class="input" id="o-phone" type="tel" formControlName="phone" placeholder="+7 900 000-00-00" autocomplete="tel" />
            @if (error('phone')) {
              <span class="field-error">{{ error('phone') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="o-email">Email</label>
            <input class="input" id="o-email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
            @if (error('email')) {
              <span class="field-error">{{ error('email') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="o-service">Услуга</label>
            <select class="select" id="o-service" formControlName="service">
              <option [ngValue]="null">— выберите услугу —</option>
              @for (s of content.servicesList(); track s.id) {
                <option [ngValue]="s.slug">{{ s.title }}</option>
              }
            </select>
          </div>
          <div class="field full">
            <label class="label" for="o-msg">Детали задачи</label>
            <textarea class="textarea" id="o-msg" formControlName="message" placeholder="Что нужно сделать?"></textarea>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="form-alert">{{ errorMessage() }}</div>
        }

        <label class="consent">
          <input type="checkbox" formControlName="consent" />
          <span>Я даю <a href="/consent/" target="_blank" rel="noopener">согласие на обработку персональных данных</a></span>
        </label>
        @if (error('consent')) {
          <span class="field-error">{{ error('consent') }}</span>
        }

        <div class="form-actions">
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? 'Отправка…' : 'Заказать услугу' }}
          </button>
        </div>
      }
    </form>
  `,
})
export class OrderFormComponent extends LeadFormBase {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);
  protected readonly content = inject(ContentService);

  /** Slug of the service to preselect (e.g. on a service detail page). */
  readonly preselectedSlug = input<string | null>(null);

  override readonly form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, phoneValidator]],
    email: ['', Validators.email],
    service: [null as string | null],
    message: [''],
    consent: [false, Validators.requiredTrue],
  });

  constructor() {
    super();
    effect(() => {
      const slug = this.preselectedSlug();
      if (slug) {
        this.form.controls['service'].setValue(slug, { emitEvent: false });
      }
    });
  }

  protected override send() {
    return this.leads.order({ ...this.form.value, smart_token: this.smartToken() } as OrderPayload);
  }
}
