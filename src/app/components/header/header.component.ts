import { Component, inject, signal, DestroyRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatRippleModule,
    RouterLink,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery = signal<string>('');
  readonly searchResults = signal<User[]>([]);
  readonly isSearching = signal(false);
  readonly showSearchResult = signal(false);
  readonly isSearchFocused = signal(false);

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim().length === 0) {
            this.showSearchResult.set(false);
            return of([]);
          }

          this.isSearching.set(true);
          this.showSearchResult.set(true);

          // Check if query is a number (ID search)
          const id = parseInt(query, 10);
          if (!isNaN(id) && id > 0 && query === String(id)) {
            // Search by ID
            return this.userService.searchUserById(id).pipe(
              switchMap((user) => (user ? of([user]) : of([])))
            );
          } else {
            // Search by name
            return this.userService.searchUsersByName(query);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((users) => {
        this.searchResults.set(users);
        this.isSearching.set(false);
      });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-wrapper')) {
      this.showSearchResult.set(false);
    }
  }

  handleSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  handleSearchFocus(): void {
    this.isSearchFocused.set(true);
    if (this.searchQuery() && (this.searchResults().length > 0 || this.isSearching())) {
      this.showSearchResult.set(true);
    }
  }

  handleSearchBlur(): void {
    // Delay to allow click events on dropdown
    setTimeout(() => {
      this.isSearchFocused.set(false);
    }, 200);
  }

  handleClearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResult.set(false);
  }

  handleNavigateToUser(id: number): void {
    this.handleClearSearch();
    this.router.navigate(['/user', id]);
  }
}
