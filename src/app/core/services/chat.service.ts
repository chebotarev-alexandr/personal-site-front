import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import type { ChatMessage } from '../models/models';

export interface ChatSendResponse {
  uid: string;
  message: ChatMessage;
}

export interface ChatMessagesResponse {
  uid: string;
  messages: ChatMessage[];
}

export interface ChatSendPayload {
  uid?: string;
  text: string;
  name?: string;
  contact?: string;
  smart_token?: string;
}

/** Chat widget: send visitor messages and poll the session's messages. */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/chat`;

  send(payload: ChatSendPayload) {
    return this.http.post<ChatSendResponse>(`${this.base}/messages/`, payload);
  }

  messages(uid: string) {
    return this.http.get<ChatMessagesResponse>(`${this.base}/${uid}/messages/`);
  }
}
