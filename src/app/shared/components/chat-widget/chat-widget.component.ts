import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  isDevMode,
  OnDestroy,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ChatService } from '../../../core/services/chat.service';
import { ContentService } from '../../../core/services/content.service';
import { SmartCaptchaService } from '../../../core/services/smart-captcha.service';
import type { ChatMessage } from '../../../core/models/models';

const UID_KEY = 'code_orbit_chat_uid';
const NAME_KEY = 'code_orbit_chat_name';
const CONTACT_KEY = 'code_orbit_chat_contact';
const SHOW_DELAY_MS = 10_000;
const POPUP_MS = 6_000;
const POLL_MS = 3_000;

@Component({
  selector: 'app-chat-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent implements OnDestroy {
  private readonly chat = inject(ChatService);
  private readonly content = inject(ContentService);
  private readonly captcha = inject(SmartCaptchaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly scrollEl = viewChild<ElementRef>('scroll');

  readonly visible = signal(false);
  readonly open = signal(false);
  readonly popup = signal(false);
  readonly uid = signal<string | null>(null);
  readonly messages = signal<ChatMessage[]>([]);
  readonly draft = signal('');
  readonly sending = signal(false);
  readonly unread = signal(0);

  readonly name = signal('');
  readonly contact = signal('');
  readonly consent = signal(false);
  readonly needsInfo = signal(true);
  readonly errorMessage = signal<string | null>(null);

  private smartToken = signal('');

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private popupTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastId = 0;
  private originalTitle = '';
  private audio: AudioContext | null = null;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      this.originalTitle = document.title;

      const storedName = localStorage.getItem(NAME_KEY);
      const storedContact = localStorage.getItem(CONTACT_KEY);
      if (storedName) {
        this.name.set(storedName);
        this.needsInfo.set(false);
      }
      if (storedContact) this.contact.set(storedContact);

      this.showTimer = setTimeout(() => {
        this.visible.set(true);
        // Всплывающая подсказка «напиши мне» — появляется вместе с иконкой и
        // исчезает через несколько секунд (или при клике).
        if (!storedName) {
          this.popup.set(true);
          this.popupTimer = setTimeout(() => this.popup.set(false), POPUP_MS);
        }
      }, SHOW_DELAY_MS);

      const stored = localStorage.getItem(UID_KEY);
      if (stored) {
        this.uid.set(stored);
        this.refresh();
        this.startPolling();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.popupTimer) clearTimeout(this.popupTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  toggle(): void {
    this.popup.set(false);
    this.open.set(!this.open());
    if (this.open()) {
      this.unread.set(0);
      this.applyUnreadAlert();
      this.scrollToBottom();
    }
    this.ensureAudio();
  }

  /** Сохраняет имя (обязательно), контакт (опционально) и согласие перед началом чата. */
  submitInfo(): void {
    const name = this.name().trim();
    if (!name) return;
    if (!this.consent()) {
      this.errorMessage.set('Необходимо согласие на обработку персональных данных.');
      return;
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(NAME_KEY, name);
      if (this.contact().trim()) {
        localStorage.setItem(CONTACT_KEY, this.contact().trim());
      }
    }
    this.name.set(name);
    this.contact.set(this.contact().trim());
    this.needsInfo.set(false);
    this.errorMessage.set(null);
    this.ensureAudio();
  }

  async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.sending() || this.needsInfo()) return;

    this.sending.set(true);
    this.errorMessage.set(null);
    try {
      const res = await this.post(text);
      this.onSent(res.uid, res.message);
    } catch (err) {
      const e = err as HttpErrorResponse;
      if (e?.status === 400 && (e.error as { code?: string } | null)?.code === 'captcha_required') {
        // Подозрение на спам → показать капчу и повторить с токеном.
        const token = await this.runCaptcha();
        if (!token) {
          this.errorMessage.set('Пройдите проверку «Я не робот» и отправьте сообщение ещё раз.');
        } else {
          this.smartToken.set(token);
          try {
            const res = await this.post(text);
            this.onSent(res.uid, res.message);
            this.smartToken.set('');
          } catch (err2) {
            this.showError(err2 as HttpErrorResponse);
          }
        }
      } else {
        this.showError(e);
      }
    } finally {
      this.sending.set(false);
    }
  }

  private async post(text: string) {
    const payload: {
      uid?: string;
      text: string;
      name?: string;
      contact?: string;
      consent?: boolean;
      smart_token?: string;
    } = { text };
    if (this.uid()) payload.uid = this.uid()!;
    if (this.name()) payload.name = this.name();
    if (this.contact()) payload.contact = this.contact();
    // Согласие передаём при первом сообщении (создании сессии).
    if (!this.uid() && this.consent()) payload.consent = true;
    const token = this.smartToken();
    if (token) payload.smart_token = token;
    return firstValueFrom(this.chat.send(payload));
  }

  private onSent(uid: string, message: ChatMessage): void {
    this.uid.set(uid);
    if (isPlatformBrowser(this.platformId)) localStorage.setItem(UID_KEY, uid);
    this.messages.update((m) => [...m, message]);
    this.lastId = Math.max(this.lastId, message.id);
    this.draft.set('');
    this.errorMessage.set(null);
    this.scrollToBottom();
    this.startPolling();
    this.playSound('send');
  }

  private showError(err: HttpErrorResponse): void {
    const detail = (err?.error as { detail?: string } | null)?.detail;
    this.errorMessage.set(detail || 'Не удалось отправить сообщение. Попробуйте ещё раз.');
  }

  private async runCaptcha(): Promise<string> {
    const clientKey = this.content.site.value()?.settings.smartcaptcha_client_key ?? '';
    if (!clientKey) return '';
    this.captcha.configure(clientKey);
    return this.captcha.getToken();
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.refresh(), POLL_MS);
  }

  private async refresh(): Promise<void> {
    const uid = this.uid();
    if (!uid) return;
    try {
      const res = await firstValueFrom(this.chat.messages(uid));
      const msgs = res.messages;
      const newLast = msgs.length ? msgs[msgs.length - 1].id : 0;
      if (newLast !== this.lastId) {
        const newOutgoing = msgs.filter((m) => m.id > this.lastId && m.direction === 'outgoing');
        this.messages.set(msgs);
        if (newOutgoing.length) {
          this.playSound('receive');
          if (!this.open()) {
            this.unread.update((u) => u + newOutgoing.length);
            this.applyUnreadAlert();
          }
        }
        this.lastId = newLast;
        if (this.open()) this.scrollToBottom();
      }
    } catch {
      if (isDevMode()) console.warn('[chat] poll failed');
    }
  }

  /** Иконка вкладки (favicon-бейдж) + заголовок при непрочитанных. */
  private applyUnreadAlert(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const unread = this.unread();
    if (unread > 0) {
      if (link) link.href = 'favicon-badge.svg';
      document.title = `🔔 (${unread}) ${this.originalTitle}`;
    } else {
      if (link) link.href = 'favicon.svg';
      document.title = this.originalTitle;
    }
  }

  private ensureAudio(): AudioContext | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      if (!this.audio) {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.audio = new Ctor();
      }
      if (this.audio.state === 'suspended') void this.audio.resume();
      return this.audio;
    } catch {
      return null;
    }
  }

  private playSound(kind: 'send' | 'receive'): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const note = (freq: number, start: number, dur: number): void => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    };
    if (kind === 'send') {
      note(880, t0, 0.09);
    } else {
      note(660, t0, 0.12);
      note(990, t0 + 0.12, 0.14);
    }
  }

  private scrollToBottom(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const el = this.scrollEl()?.nativeElement as HTMLElement | undefined;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
