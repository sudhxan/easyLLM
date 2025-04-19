// src/app/core/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkThemeSubject = new BehaviorSubject<boolean>(false);
  darkTheme$ = this.darkThemeSubject.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('darkTheme');
    const isDark = savedTheme === 'true';
    this.darkThemeSubject.next(isDark);
    this.applyTheme(isDark);
  }

  isDarkTheme(): boolean {
    return this.darkThemeSubject.value;
  }

  toggleDarkTheme(): void {
    const isDark = !this.darkThemeSubject.value;
    this.darkThemeSubject.next(isDark);
    this.applyTheme(isDark);
    localStorage.setItem('darkTheme', isDark.toString());
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
