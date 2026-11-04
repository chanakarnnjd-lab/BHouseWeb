import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RecipeIngredient {
  id: number;
  itemId: number;
  name: string;
  quantity: number;
  unitId: number;
  price: number;
}

export interface Recipe {
  id: number;
  menu: string;
  margin: number;
  additionalCostPerUnit: number;
  servings: number;
  userId: string;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeInput {
  menu: string;
  margin: number;
  acc_unit: number;
  serve: number;
  userId: string;
  picUrl: string | null;
  ingredients: { itemId: number; qty: number }[];
}

interface ApiEnvelope {
  success: boolean;
  message?: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  constructor(private readonly api: ApiService) {}

  getAll(): Observable<Recipe[]> {
    return this.api.get<ApiEnvelope>('recipes').pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'The API returned an invalid recipe list.');
        }
        return response.data.map((record) => this.toRecipe(record));
      })
    );
  }

  getById(id: number): Observable<Recipe> {
    return this.api.get<ApiEnvelope>(`recipes/${id}`).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'The API could not find this recipe.');
        }
        return this.toRecipe(response.data);
      })
    );
  }

  create(recipe: RecipeInput): Observable<unknown> {
    return this.api.post<unknown>('recipes', recipe).pipe(
      map((response) => this.assertSuccess(response, 'Could not create this recipe.'))
    );
  }

  update(id: number, recipe: RecipeInput): Observable<unknown> {
    return this.api.put<unknown>(`recipes/${id}`, recipe).pipe(
      map((response) => this.assertSuccess(response, 'Could not update this recipe.'))
    );
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete<unknown>(`recipes/${id}`).pipe(
      map((response) => this.assertSuccess(response, 'Could not delete this recipe.'))
    );
  }

  private assertSuccess(response: unknown, fallbackMessage: string): unknown {
    if (!this.isRecord(response) || response['success'] !== true) {
      const message = this.isRecord(response) && typeof response['message'] === 'string'
        ? response['message']
        : fallbackMessage;
      throw new Error(message);
    }
    return response;
  }

  private toRecipe(value: unknown): Recipe {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid recipe.');
    }

    const id = this.toNumber(value['recipesId']);
    const margin = this.toNumber(value['margin']);
    const additionalCostPerUnit = this.toNumber(value['acc_unit']);
    const servings = this.toNumber(value['serve']);
    const name = value['menu'];
    const userId = value['userId'];
    const imageUrl = value['picUrl'];
    const ingredients = value['ingredients'];

    if (
      id === null || margin === null || additionalCostPerUnit === null || servings === null ||
      typeof name !== 'string' || typeof userId !== 'string' ||
      (imageUrl !== null && imageUrl !== undefined && typeof imageUrl !== 'string') ||
      !Array.isArray(ingredients)
    ) {
      throw new Error('The API returned a recipe with missing or invalid fields.');
    }

    return {
      id,
      menu: name,
      margin,
      additionalCostPerUnit,
      servings,
      userId,
      imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
      ingredients: ingredients.map((ingredient) => this.toRecipeIngredient(ingredient))
    };
  }

  private toRecipeIngredient(value: unknown): RecipeIngredient {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid recipe ingredient.');
    }

    const id = this.toNumber(value['ingredientId']);
    const itemId = this.toNumber(value['itemId']);
    const quantity = this.toNumber(value['qty']);
    const unitId = this.toNumber(value['unitId']);
    const price = this.toNumber(value['price']);
    const name = value['itemName'];

    if (
      id === null || itemId === null || quantity === null || unitId === null ||
      price === null || typeof name !== 'string'
    ) {
      throw new Error('The API returned a recipe ingredient with missing or invalid fields.');
    }

    return { id, itemId, name, quantity, unitId, price };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
