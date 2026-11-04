import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint = ''): Observable<T> {
    const path = endpoint.replace(/^\/+/, '');
    const url = path ? `${this.baseUrl}/${path}` : this.baseUrl;
    return this.http.get<T>(url);
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.urlFor(endpoint), body);
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.urlFor(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.urlFor(endpoint));
  }

  private urlFor(endpoint: string): string {
    return `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
  }
}
