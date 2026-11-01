import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LeadService } from '../../../core/services/lead.service';
import type { SubscribePayload } from '../../../core/models/models';
import { LeadFormBase } from './lead-form.base';

@Component({
  selector: 'app-subscribe-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      @if (success()) {
        <span class="subscribe-success">✓ Вы подписаны!</span>
      } @else {
        <div class="subscribe-row">
          <input
            class="input"
            type="email"
            formControlName="email"
            placeholder="Ваш email"
            aria-label="Email для подписки"
            autocomplete="email"
          />
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? '…' : 'Подписаться' }}
          </button>
        </div>
        @if (error('email')) {
          <span class="field-error">{{ error('email') }}</span>
        }
        <label class="consent">
          <input type="checkbox" formControlName="consent" />
          <span>Я даю <a href="/consent/" target="_blank" rel="noopener">согласие на обработку персональных данных</a></span>
        </label>
        @if (error('consent')) {
          <span class="field-error">{{ error('consent') }}</span>
        }
      }
    </form>
  `,
  styles: `
    .subscribe-row {
      display: flex;
      gap: 0.5rem;
    }
    .subscribe-row .input {
      flex: 1;
      min-width: 0;
    }
    .subscribe-row .btn {
      white-space: nowrap;
      padding-inline: 1rem;
    }
    .subscribe-success {
      color: var(--success);
      font-size: 0.9rem;
    }
  `,
})
export class SubscribeFormComponent extends LeadFormBase {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);

  override readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    consent: [false, Validators.requiredTrue],
  });

  protected override send() {
    return this.leads.subscribe({ ...this.form.value, smart_token: this.smartToken() } as SubscribePayload);
  }
}
