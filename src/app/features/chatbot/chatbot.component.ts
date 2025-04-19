import { Component, OnInit } from '@angular/core';
import { ChatbotService } from './chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  currentMode: 'chat' | 'visual' = 'chat';
  userMessage: string = '';
  showChatInput: boolean = false;
  selectionsCompleted: boolean = false;

  messages: {
    content?: string;
    contentType?: 'text' | 'image';
    type: 'sent' | 'received';
    time: string;
    buttons?: string[];
    buttonAction?: string;
  }[] = [
    {
      content:
        'Hello! What kind of request can I assist you with today? ' +
        'Please choose one of the databases below to get started followed by a table.',
      contentType: 'text',
      type: 'received',
      time: this.getCurrentTime(),
      buttons: [
        'NYC Taxi',
        'TCH'
      ],
      buttonAction: 'option'
    }
  ];
  isTyping: boolean = false;
  imageBase64: string | null = null;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit() {
    
  }

  // Handle all button clicks
  onButtonClick(option: string, action?: string) {
    if (this.selectionsCompleted) {
      return; // Ignore clicks if selections are completed
    }
    if (action === 'option') {
      this.onOptionButtonClick(option);
    } else if (action === 'secondary') {
      this.onSecondaryButtonClick(option);
    } else {
      console.warn(`Undefined action for option: ${option}`);
    }
  }

  onOptionButtonClick(option: string) {
    this.messages.push({
      content: option,
      contentType: 'text',
      type: 'sent',
      time: this.getCurrentTime()
    });

    let secondaryOptions: string[] = [];
    let buttonAction = 'secondary';
    if (option === 'NYC Taxi') {
      secondaryOptions = ['Trips'];
    } else if (option === 'TCH') {
      secondaryOptions = ['Option 1', 'Option 2', 'Option 3'];
    } 

    // Display secondary buttons as a received message
    this.messages.push({
      type: 'received',
      time: this.getCurrentTime(),
      buttons: secondaryOptions,
      buttonAction: buttonAction
    });
  }

  onSecondaryButtonClick(option: string) {
    // Add user's selection as a sent message
    this.messages.push({
      content: option,
      contentType: 'text',
      type: 'sent',
      time: this.getCurrentTime()
    });

    this.messages.push({
      content:
        'Thank you for sharing! I am ready to help you with this request, ' +
        'what would you like to know?',
      contentType: 'text',
      type: 'received',
      time: this.getCurrentTime()
    });

    this.showChatInput = true;

    this.selectionsCompleted = true;
  }

  switchMode(mode: 'chat' | 'visual') {
    this.currentMode = mode;
    this.userMessage = '';
    this.isTyping = false;
    if (mode === 'chat') {
      this.imageBase64 = null;
    }
  }

  sendMessage() {
    if (!this.userMessage.trim() || !this.showChatInput) return;

    this.messages.push({
      content: this.userMessage,
      contentType: 'text',
      type: 'sent',
      time: this.getCurrentTime()
    });

    this.isTyping = true;
    const visualAnalysis = this.currentMode === 'visual';

    this.chatbotService
      .sendMessageToBackend(this.userMessage, visualAnalysis)
      .subscribe({
        next: (response) => {
          this.handleBackendResponse(response);
          this.isTyping = false;
        },
        error: (error) => {
          let errorMessage = 'Error: Could not retrieve response from server.';
          if (error.error && error.error.error) {
            errorMessage = 'Error: ' + error.error.error;
          }
          this.messages.push({
            content: errorMessage,
            contentType: 'text',
            type: 'received',
            time: this.getCurrentTime()
          });
          this.isTyping = false;
        }
      });

    this.userMessage = '';
  }

  private handleBackendResponse(response: any) {
    if (response.image_base64) {
      this.imageBase64 = 'data:image/png;base64,' + response.image_base64;
      this.messages.push({
        content: this.imageBase64 || '',
        contentType: 'image',
        type: 'received',
        time: this.getCurrentTime()
      });
    } else if (response.output) {
      this.messages.push({
        content: response.output,
        contentType: 'text',
        type: 'received',
        time: this.getCurrentTime()
      });
    } else if (response.error) {
      this.messages.push({
        content: response.error,
        contentType: 'text',
        type: 'received',
        time: this.getCurrentTime()
      });
    } else {
      this.messages.push({
        content: 'An unexpected error occurred.',
        contentType: 'text',
        type: 'received',
        time: this.getCurrentTime()
      });
    }
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
