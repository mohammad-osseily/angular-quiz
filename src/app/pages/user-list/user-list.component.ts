import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { UserCardComponent } from '../../components/user-card/user-card.component';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatIconModule, UserCardComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly users = signal<User[]>([]);
  readonly currentPage = signal(1);
  readonly totalUsers = signal(0);
  readonly pageSize = signal(6);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getUsers(this.currentPage()).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalUsers.set(response.total);
        this.pageSize.set(response.per_page);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load users');
        this.isLoading.set(false);
      },
    });
  }

  handlePageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.loadUsers();
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
