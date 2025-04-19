// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatbotComponent } from './features/chatbot/chatbot.component';
import { GeneralChatComponent } from './features/general-chat/general-chat.component';
import { TutorialComponent } from './features/tutorial/tutorial.component';
import { PageNotFoundComponent } from './core/components/page-not-found/page-not-found.component';

const routes: Routes = [
  { path: 'chatbot', component: ChatbotComponent },
  { path: 'general-chat', component: GeneralChatComponent },
  { path: 'tutorial', component: TutorialComponent },
  { path: '', redirectTo: '/chatbot', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent } // Handle invalid URLs
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
