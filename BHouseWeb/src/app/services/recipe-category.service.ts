import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecipeCategory } from './recipe.service';

interface ApiEnvelope {
  success: boolean;
  message?: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class RecipeCategoryService {
  constructor(private readonly api: ApiService) {}

  getAll(): Observable<RecipeCategory[]> {
    return this.api.get<ApiEnvelope>('categories').pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'The API returned an invalid category list.');
        }
        return response.data.map((value) => this.toCategory(value));
      })
    );
  }

  create(name: string): Observable<RecipeCategory> {
    return this.api.post<ApiEnvelope>('categories', { categoryName: name }).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Could not create this category.');
        }
        return this.toCategory(response.data);
      })
    );
  }

  private toCategory(value: unknown): RecipeCategory {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('The API returned an invalid recipe category.');
    }

    const record = value as Record<string, unknown>;
    const idValue = record['categoryId'];
    const id = typeof idValue === 'number' || typeof idValue === 'string' ? Number(idValue) : NaN;
    const name = record['categoryName'];
    if (!Number.isSafeInteger(id) || id < 1 || typeof name !== 'string') {
      throw new Error('The API returned a category with missing or invalid fields.');
    }
    return { id, name };
  }
}
