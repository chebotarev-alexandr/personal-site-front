import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LeadService } from '../../../core/services/lead.service';
import type { ConsultationPayload } from '../../../core/models/models';
import { phoneValidator } from '../../validators';
import { LeadFormBase } from './lead-form.base';

@Component({
  selector: 'app-consultation-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      @if (success()) {
        <div class="form-success" role="status">
          <strong>Готово!</strong> Свяжусь с вами для бесплатной консультации.
        </div>
      } @else {
        <div class="form-grid">
          <div class="field">
            <label class="label" for="cn-name">Имя *</label>
            <input class="input" id="cn-name" type="text" formControlName="name" placeholder="Как к вам обращаться" autocomplete="name" />
            @if (error('name')) {
              <span class="field-error">{{ error('name') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="cn-phone">Телефон *</label>
            <input class="input" id="cn-phone" type="tel" formControlName="phone" placeholder="+7 900 000-00-00" autocomplete="tel" />
            @if (error('phone')) {
              <span class="field-error">{{ error('phone') }}</span>
            }
          </div>
          <div class="field full">
            <label class="label" for="cn-msg">Опишите задачу</label>
            <textarea class="textarea" id="cn-msg" formControlName="message" placeholder="Что хотите обсудить?"></textarea>
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
            {{ submitting() ? 'Отправка…' : 'Получить консультацию' }}
          </button>
        </div>
      }
    </form>
  `,
})
export class ConsultationFormComponent extends LeadFormBase {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);

  override readonly form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, phoneValidator]],
    message: [''],
    consent: [false, Validators.requiredTrue],
  });

  protected override send() {
    return this.leads.consultation({ ...this.form.value, smart_token: this.smartToken() } as ConsultationPayload);
  }
}
