import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { inject, signal } from '@angular/core';

import { ContentService } from '../../../core/services/content.service';
import { mapApiError } from '../../../core/services/api-error';
import { SmartCaptchaService } from '../../../core/services/smart-captcha.service';

/**
 * Shared submit lifecycle for lead forms: client validation, submit,
 * server-side field errors, success state.
 *
 * Капча запрашивается только на повторную отправку: сначала шлём без токена,
 * и только если бэкенд отвечает `captcha_required` — запускаем SmartCaptcha
 * и повторяем отправку уже с токеном.
 */
export abstract class LeadFormBase {
  abstract readonly form: FormGroup;

  private readonly contentService = inject(ContentService);
  private readonly captcha = inject(SmartCaptchaService);

  readonly submitting = signal(false);
  readonly success = signal(false);
  readonly errorMessage = signal<string | null>(null);
  protected readonly smartToken = signal('');

  private readonly fieldErrors = signal<Record<string, string>>({});

  protected abstract send(): Observable<unknown>;

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.success.set(false);
    this.errorMessage.set(null);
    this.fieldErrors.set({});

    this.send().subscribe({
      next: () => this.onSuccess(),
      error: (err: HttpErrorResponse) => {
        if (this.isCaptchaRequired(err)) {
          this.submitWithCaptcha();
        } else {
          this.onError(err);
        }
      },
    });
  }

  private isCaptchaRequired(err: HttpErrorResponse): boolean {
    const data = err.error;
    return (
      err.status === 400 &&
      !!data &&
      typeof data === 'object' &&
      data.code === 'captcha_required'
    );
  }

  private async submitWithCaptcha(): Promise<void> {
    const clientKey = this.contentService.site.value()?.settings.smartcaptcha_client_key ?? '';
    if (!clientKey) {
      this.errorMessage.set('Пройдите проверку «Я не робот» и отправьте форму ещё раз.');
      this.submitting.set(false);
      return;
    }

    this.captcha.configure(clientKey);
    const token = await this.captcha.getToken();
    if (!token) {
      this.errorMessage.set('Пройдите проверку «Я не робот» и отправьте форму ещё раз.');
      this.submitting.set(false);
      return;
    }

    this.smartToken.set(token);
    this.send().subscribe({
      next: () => this.onSuccess(),
      error: (err: HttpErrorResponse) => this.onError(err),
    });
  }

  private onSuccess(): void {
    this.submitting.set(false);
    this.success.set(true);
    this.form.reset();
  }

  private onError(err: HttpErrorResponse): void {
    this.submitting.set(false);
    const mapped = mapApiError(err);
    this.fieldErrors.set(mapped.fieldErrors);
    this.errorMessage.set(mapped.message);
  }

  /** Server field error, falling back to a client-side validation message. */
  error(name: string): string | null {
    const server = this.fieldErrors()[name];
    if (server) return server;

    const control = this.form.get(name);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return 'Обязательное поле';
      if (control.errors?.['requiredTrue']) return 'Необходимо согласие на обработку персональных данных';
      if (control.errors?.['email']) return 'Некорректный email';
      if (control.errors?.['phone']) return 'Некорректный номер';
    }
    return null;
  }
}
