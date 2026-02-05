import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { User, UserResponse, UsersResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  private readonly apiKey = 'reqres_bdb071c11fee481a810bc13046f07549';

  private get httpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      }),
    };
  }

  // Cache storage
  private readonly usersCache = new Map<number, UsersResponse>();
  private readonly userCache = new Map<number, User>();
  private allUsersLoaded = false;
  private allUsers: User[] = [];

  getUsers(page: number = 1): Observable<UsersResponse> {
    // Check cache first
    const cached = this.usersCache.get(page);
    if (cached) {
      return of(cached);
    }

    return this.http.get<UsersResponse>(`${this.baseUrl}?page=${page}&per_page=6`, this.httpOptions).pipe(
      tap((response) => {
        // Store in cache
        this.usersCache.set(page, response);
        // Also cache individual users
        response.data.forEach((user) => this.userCache.set(user.id, user));
      })
    );
  }

  getUserById(id: number): Observable<User> {
    // Check cache first
    const cached = this.userCache.get(id);
    if (cached) {
      return of(cached);
    }

    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`, this.httpOptions).pipe(
      tap((response) => {
        // Store in cache
        this.userCache.set(id, response.data);
      }),
      map((response) => response.data)
    );
  }

  searchUserById(id: number): Observable<User | null> {
    // Check cache first
    const cached = this.userCache.get(id);
    if (cached) {
      return of(cached);
    }

    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`, this.httpOptions).pipe(
      tap((response) => {
        this.userCache.set(id, response.data);
      }),
      map((response) => response.data),
      catchError(() => of(null))
    );
  }

  // Load all users for name search (reuses loadAllUsersComplete)
  private loadAllUsers(): Observable<User[]> {
    return this.loadAllUsersComplete();
  }

  // Fetch all users for search (does not affect pagination cache)
  loadAllUsersComplete(): Observable<User[]> {
    if (this.allUsersLoaded && this.allUsers.length > 0) {
      return of(this.allUsers);
    }

    // Fetch all users at once (max 12 from reqres API)
    return this.http.get<UsersResponse>(`${this.baseUrl}?page=1&per_page=12`, this.httpOptions).pipe(
      map((response) => {
        // Only cache individual users, NOT the page response
        // This prevents conflicts with the paginated view
        response.data.forEach((user) => this.userCache.set(user.id, user));
        
        this.allUsers = response.data;
        this.allUsersLoaded = true;
        return response.data;
      })
    );
  }

  // Search users by name (case-insensitive partial match)
  searchUsersByName(query: string): Observable<User[]> {
    const searchTerm = query.toLowerCase().trim();

    return this.loadAllUsersComplete().pipe(
      map((users) =>
        users.filter(
          (user) =>
            user.first_name.toLowerCase().includes(searchTerm) ||
            user.last_name.toLowerCase().includes(searchTerm) ||
            `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm)
        )
      )
    );
  }

  clearCache(): void {
    this.usersCache.clear();
    this.userCache.clear();
    this.allUsersLoaded = false;
    this.allUsers = [];
  }
}
