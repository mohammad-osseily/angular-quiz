import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, map, catchError, forkJoin } from 'rxjs';
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

  // Load all users for name search
  private loadAllUsers(): Observable<User[]> {
    if (this.allUsersLoaded && this.allUsers.length > 0) {
      return of(this.allUsers);
    }

    // First, get page 1 to know total pages
    return this.http.get<UsersResponse>(`${this.baseUrl}?page=1&per_page=12`, this.httpOptions).pipe(
      map((firstPage) => {
        const totalPages = firstPage.total_pages;
        const allUsers: User[] = [...firstPage.data];

        // Cache these users
        firstPage.data.forEach((user) => this.userCache.set(user.id, user));

        // If there are more pages, we need to fetch them
        // For simplicity, we'll work with what we have from page 1 and 2
        return allUsers;
      }),
      tap((users) => {
        this.allUsers = users;
        this.allUsersLoaded = true;
      })
    );
  }

  // Fetch all pages to get all users
  loadAllUsersComplete(): Observable<User[]> {
    if (this.allUsersLoaded && this.allUsers.length > 0) {
      return of(this.allUsers);
    }

    // First get page 1 to know total pages
    return this.http.get<UsersResponse>(`${this.baseUrl}?page=1&per_page=12`, this.httpOptions).pipe(
      map((response) => {
        const requests: Observable<UsersResponse>[] = [];
        const totalPages = response.total_pages;

        // We already have page 1, cache it
        this.usersCache.set(1, response);
        response.data.forEach((user) => this.userCache.set(user.id, user));

        // Create requests for remaining pages
        for (let page = 2; page <= totalPages; page++) {
          const cached = this.usersCache.get(page);
          if (cached) {
            requests.push(of(cached));
          } else {
            requests.push(
              this.http.get<UsersResponse>(`${this.baseUrl}?page=${page}&per_page=12`, this.httpOptions).pipe(
                tap((res) => {
                  this.usersCache.set(page, res);
                  res.data.forEach((user) => this.userCache.set(user.id, user));
                })
              )
            );
          }
        }

        return { firstPage: response, requests };
      }),
      // Flatten and combine all users
      map(({ firstPage, requests }) => {
        if (requests.length === 0) {
          this.allUsers = firstPage.data;
          this.allUsersLoaded = true;
          return of(firstPage.data);
        }

        return forkJoin(requests).pipe(
          map((responses) => {
            const allUsers = [
              ...firstPage.data,
              ...responses.flatMap((r) => r.data),
            ];
            this.allUsers = allUsers;
            this.allUsersLoaded = true;
            return allUsers;
          })
        );
      }),
      // Flatten the nested observable
      (source) =>
        new Observable<User[]>((subscriber) => {
          source.subscribe({
            next: (result) => {
              if (result instanceof Observable) {
                result.subscribe({
                  next: (users) => subscriber.next(users),
                  error: (err) => subscriber.error(err),
                  complete: () => subscriber.complete(),
                });
              } else {
                subscriber.next(result as User[]);
                subscriber.complete();
              }
            },
            error: (err) => subscriber.error(err),
          });
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
