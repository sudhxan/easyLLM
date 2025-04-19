// src/app/features/chatbot/chatbot.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://127.0.0.1:5000/ask'; // Existing endpoint for Chat Now
  private generalChatApiUrl = 'http://127.0.0.1:5000/general-chat'; // New endpoint for General Chat

  constructor(private http: HttpClient) {}

  /**
   * Sends a message to the backend API for Chat Now.
   */
  sendMessageToBackend(message: string, visualAnalysis: boolean): Observable<any> {
    const payload = {
      question: message,
      visual_analysis: visualAnalysis.toString()
    };
    return this.http.post<any>(this.apiUrl, payload);
  }

  /**
   * Sends a message and optional file to the backend API for General Chat.
   */
  sendGeneralMessageToBackend(message: string, file?: File, replyingTo?: any): Observable<any> {
    const formData = new FormData();
    formData.append('question', message);
    if (file) {
      formData.append('file', file, file.name);
    }
    if (replyingTo) {
      if (replyingTo.timestamp) {
        formData.append('selected_message_time', replyingTo.timestamp.toISOString());
      }
      if (replyingTo.parentQuestion) {
        formData.append('selected_message_parent_question', replyingTo.parentQuestion);
      } else {
        // For messages without a parentQuestion (e.g., initial messages)
        formData.append('selected_message_parent_question', replyingTo.originalContent || '');
      }
    }
    return this.http.post<any>(this.generalChatApiUrl, formData);
  }
}
