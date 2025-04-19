// src/app/core/components/navbar/navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isDarkTheme: boolean = false;
  isCollapsed: boolean = false;
  private themeSubscription: Subscription | undefined;

  navItems = [
    { text: 'General RAG Chat', icon: 'question_answer', link: '/general-chat' },
    { text: 'Custom LLM Chat', icon: 'assistant', link: '/chatbot' },
    { text: 'Help', icon: 'info', link: '/tutorial' },
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // Load the collapsed state from localStorage when we toggle
    const collapsed = localStorage.getItem('isSidebarCollapsed') === 'true';
    this.isCollapsed = collapsed;

    this.themeSubscription = this.themeService.darkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });
  }

  toggleTheme() {
    this.themeService.toggleDarkTheme();
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    // Save the collapsed state in localStorage
    localStorage.setItem('isSidebarCollapsed', this.isCollapsed.toString());
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  get logoImage(): string {
    return 'assets/images/pvt_llm_logo.png';
  }

  get footerLogoImage(): string {
    return this.isDarkTheme
      ? 'assets/images/pvt_llm_logo.png'
      : 'assets/images/pvt_llm_logo.png';
  }
}
