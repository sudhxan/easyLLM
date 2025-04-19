// src/app/features/general-chat/general-chat.component.ts

import { Component, ViewChild, ElementRef, Renderer2, AfterViewChecked, SecurityContext, OnInit } from '@angular/core';
import { ChatbotService } from '../chatbot/chatbot.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked, Tokens } from 'marked';
import hljs from 'highlight.js';

interface Message {
  content: string | SafeHtml;
  contentType: 'text' | 'html' | 'image';
  type: 'sent' | 'received';
  time: string;
  timestamp?: Date;
  fileName?: string;
  originalContent?: string;
  copySuccess?: boolean;
  copyable?: boolean;
  parentQuestion?: string;
}

@Component({
  selector: 'app-general-chat',
  templateUrl: './general-chat.component.html',
  styleUrls: ['./general-chat.component.scss'],
})
export class GeneralChatComponent implements AfterViewChecked, OnInit {
  userMessage: string = '';
  lastUserMessage: string = '';
  selectedFile: File | undefined = undefined;
  messages: Message[] = [];
  isTyping: boolean = false;
  replyingTo: Message | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2
  ) {
    // Create custom renderer for Markdown
    const rendererMD = new marked.Renderer();

    rendererMD.code = ({ text, lang }: Tokens.Code): string => {
      const code = text;
      const language = lang || '';
      const codeId = 'code-' + Math.random().toString(36).substr(2, 9);

      if (language && hljs.getLanguage(language)) {
        const highlighted = hljs.highlight(code, { language: language, ignoreIllegals: true }).value;
        return `
          <div class="code-block">
            <button class="copy-button" data-code-id="${codeId}">Copy</button>
            <pre><code id="${codeId}" class="hljs ${language}">${highlighted}</code></pre>
          </div>
        `;
      } else {
        const highlighted = hljs.highlightAuto(code).value;
        return `
          <div class="code-block">
            <button class="copy-button" data-code-id="${codeId}">Copy</button>
            <pre><code id="${codeId}" class="hljs">${highlighted}</code></pre>
          </div>
        `;
      }
    };

    // Set the renderer and ensure parsing is synchronous
    marked.setOptions({
      renderer: rendererMD,
      async: false,
    });
  }

  ngOnInit() {
    // Initialize messages in ngOnInit to ensure DomSanitizer is available
    this.messages = [
      {
        content: this.sanitizeMessage(
          'Welcome to General Chat! You can ask me anything or upload a document for reference.'
        ),
        contentType: 'html',
        type: 'received',
        time: this.getCurrentTime(),
        originalContent: 'Welcome to General Chat! You can ask me anything or upload a document for reference.',
        copyable: false, // Set copyable to false for first message
      },
    ];
  }

  // Trigger file input click
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  // Handle file selection
  onFileSelected(event: any) {
    const files: { [key: string]: File } = event.target.files;
    this.selectedFile = files && files[0] ? files[0] : undefined;
    if (this.selectedFile) {
      console.log('Selected file:', this.selectedFile.name);
    }
  }

  // Handle reply button click
  onReply(message: Message) {
    this.replyingTo = message;
  }

  // Cancel reply
  cancelReply() {
    this.replyingTo = null;
  }

  // Send message and file to backend
  sendMessage() {
    if (this.userMessage.trim() || this.selectedFile) {
      this.lastUserMessage = this.userMessage;

      if (this.userMessage.trim()) {
        this.messages.push({
          content: this.userMessage,
          contentType: 'text',
          type: 'sent',
          time: this.getCurrentTime(),
          timestamp: new Date(),
          fileName: this.selectedFile ? this.selectedFile.name : undefined,
          originalContent: this.userMessage,
        });
      }

      this.isTyping = true;

      this.chatbotService
        .sendGeneralMessageToBackend(this.userMessage, this.selectedFile, this.replyingTo)
        .subscribe({
          next: (response: any) => {
            this.handleBackendResponse(response);
            this.isTyping = false;
          },
          error: (error: any) => {
            this.handleError(error);
            this.isTyping = false;
          },
        });

      this.userMessage = '';
      this.selectedFile = undefined;
      this.replyingTo = null;
    }
  }

  getReplyingToContent(message: Message): string {
    if (message.originalContent) {
      return message.originalContent;
    } else if (typeof message.content === 'string') {
      return message.content;
    } else {
      const sanitizedContent = this.sanitizer.sanitize(SecurityContext.HTML, message.content) || '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitizedContent;
      return tempDiv.innerText;
    }
  }

  removeSelectedFile() {
    this.selectedFile = undefined;
  }

  messageContainsCode(message: Message): boolean {
    if (message.contentType === 'html' && typeof message.content === 'string') {
      return message.content.includes('<pre><code');
    }
    return false;
  }

  private handleBackendResponse(response: any) {
    if (response.output) {
      const safeContent = this.sanitizeMessage(response.output);
      this.messages.push({
        content: safeContent,
        contentType: 'html',
        type: 'received',
        time: this.getCurrentTime(),
        timestamp: new Date(),
        originalContent: response.output,
        copyable: true,
        parentQuestion: this.lastUserMessage,
      });
    } else if (response.error) {
      this.messages.push({
        content: response.error,
        contentType: 'text',
        type: 'received',
        time: this.getCurrentTime(),
        originalContent: response.error,
        copyable: true,
      });
    } else {
      this.messages.push({
        content: 'An unexpected error occurred.',
        contentType: 'text',
        type: 'received',
        time: this.getCurrentTime(),
        originalContent: 'An unexpected error occurred.',
        copyable: true,
      });
    }
  }

  private handleError(error: any) {
    console.error('Error in sending message to backend:', error);
    let errorMessage = 'Error: Could not retrieve response from server.';
    if (error.error && error.error.error) {
      errorMessage = 'Error: ' + error.error.error;
    }
    this.messages.push({
      content: errorMessage,
      contentType: 'text',
      type: 'received',
      time: this.getCurrentTime(),
      originalContent: errorMessage,
      copyable: true,
    });
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  sanitizeMessage(message: string): SafeHtml {
    const parsed = marked.parse(message) as string;
    return this.sanitizer.bypassSecurityTrustHtml(parsed);
  }

  ngAfterViewChecked() {
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach((button: Element) => {
      if (!button.hasAttribute('listener-attached')) {
        button.setAttribute('listener-attached', 'true');
        this.renderer.listen(button, 'click', () => {
          const codeId = button.getAttribute('data-code-id');
          const codeElement = document.getElementById(codeId!);
          if (codeElement) {
            const codeText = codeElement.innerText;
            this.copyToClipboard(codeText, button);
          }
        });
      }
    });
  }

  copyToClipboard(text: string, button: Element) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => (button.textContent = 'Copy'), 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  }

  copyMessageContent(message: Message) {
    let contentToCopy = '';

    if (message.originalContent) {
      contentToCopy = message.originalContent;
    } else if (message.contentType === 'text') {
      contentToCopy = message.content as string;
    } else if (message.contentType === 'html') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, message.content) || '';
      contentToCopy = tempElement.innerText;
    }

    navigator.clipboard
      .writeText(contentToCopy)
      .then(() => {
        message.copySuccess = true;
        setTimeout(() => {
          message.copySuccess = false;
        }, 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  }
}
