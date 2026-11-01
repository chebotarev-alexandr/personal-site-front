import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LeadService } from '../../../core/services/lead.service';
import { ContentService } from '../../../core/services/content.service';
import type { BriefPayload } from '../../../core/models/models';
import { phoneValidator } from '../../validators';
import { LeadFormBase } from './lead-form.base';

@Component({
  selector: 'app-brief-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      @if (success()) {
        <div class="form-success" role="status">
          <strong>Бриф получен!</strong> Изучу задачу и вернусь с оценкой сроков и стоимости.
        </div>
      } @else {
        <div class="form-grid">
          <div class="field">
            <label class="label" for="b-name">Имя *</label>
            <input class="input" id="b-name" type="text" formControlName="name" placeholder="Как к вам обращаться" autocomplete="name" />
            @if (error('name')) {
              <span class="field-error">{{ error('name') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="b-email">Email *</label>
            <input class="input" id="b-email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email" />
            @if (error('email')) {
              <span class="field-error">{{ error('email') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="b-phone">Телефон</label>
            <input class="input" id="b-phone" type="tel" formControlName="phone" placeholder="+7 900 000-00-00" autocomplete="tel" />
            @if (error('phone')) {
              <span class="field-error">{{ error('phone') }}</span>
            }
          </div>
          <div class="field">
            <label class="label" for="b-company">Компания</label>
            <input class="input" id="b-company" type="text" formControlName="company" placeholder="Название компании" autocomplete="organization" />
          </div>
          <div class="field">
            <label class="label" for="b-service">Услуга</label>
            <select class="select" id="b-service" formControlName="service">
              <option [ngValue]="null">— выберите услугу —</option>
              @for (s of content.servicesList(); track s.id) {
                <option [ngValue]="s.slug">{{ s.title }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label" for="b-budget">Бюджет</label>
            <select class="select" id="b-budget" formControlName="budget">
              <option [ngValue]="null">— не определён —</option>
              @for (b of content.budgets.value() ?? []; track b.id) {
                <option [ngValue]="b.id">{{ b.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label class="label" for="b-deadline">Сроки</label>
            <input class="input" id="b-deadline" type="text" formControlName="deadline" placeholder="Например: в течение месяца" />
          </div>
          <div class="field full">
            <label class="label" for="b-msg">Описание задачи</label>
            <textarea class="textarea" id="b-msg" formControlName="message" placeholder="Цели, объём, пожелания…"></textarea>
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
            {{ submitting() ? 'Отправка…' : 'Отправить бриф' }}
          </button>
        </div>
      }
    </form>
  `,
})
export class BriefFormComponent extends LeadFormBase {
  private readonly fb = inject(FormBuilder);
  private readonly leads = inject(LeadService);
  protected readonly content = inject(ContentService);

  override readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator],
    company: [''],
    service: [null as string | null],
    budget: [null as number | null],
    deadline: [''],
    message: [''],
    consent: [false, Validators.requiredTrue],
  });

  protected override send() {
    return this.leads.brief({ ...this.form.value, smart_token: this.smartToken() } as BriefPayload);
  }
}
