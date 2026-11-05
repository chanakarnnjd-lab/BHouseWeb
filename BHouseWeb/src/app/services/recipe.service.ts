import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface RecipeIngredient {
  id: number;
  itemId: number;
  name: string;
  quantity: number;
  unitId: number;
  unitName: string;
  stockQuantity: number | null;
  inventoryUnitId: number | null;
  price: number;
}

export interface RecipeIngredientCost {
  id: number;
  itemId: number;
  name: string;
  quantity: number;
  unitId: number;
  unitName: string;
  costPerUnit: number;
  totalCost: number;
}

export interface RecipeCategory {
  id: number;
  name: string;
}

export interface Recipe {
  id: number;
  menu: string;
  margin: number;
  sellingPrice: number;
  servings: number;
  userId: string;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
  categories: RecipeCategory[];
}

export interface RecipeInput {
  menu: string;
  margin: number;
  acc_unit: number;
  serve: number;
  userId: string;
  picUrl: string | null;
  ingredients: { itemId: number; unitId: number; qty: number }[];
  categoryIds: number[];
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

  getIngredientCosts(id: number): Observable<RecipeIngredientCost[]> {
    return this.api.get<ApiEnvelope>(`recipes/${id}/ingredients/cost`).pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'The API returned an invalid ingredient cost list.');
        }
        return response.data.map((ingredient) => this.toRecipeIngredientCost(ingredient));
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
    const sellingPrice = this.toNumber(value['acc_unit']);
    const servings = this.toNumber(value['serve']);
    const name = value['menu'];
    const userId = value['userId'];
    const imageUrl = value['picUrl'];
    const ingredients = value['ingredients'];
    const categories = value['categories'] ?? [];

    if (
      id === null || margin === null || sellingPrice === null || servings === null ||
      typeof name !== 'string' || typeof userId !== 'string' ||
      (imageUrl !== null && imageUrl !== undefined && typeof imageUrl !== 'string') ||
      !Array.isArray(ingredients) || !Array.isArray(categories)
    ) {
      throw new Error('The API returned a recipe with missing or invalid fields.');
    }

    return {
      id,
      menu: name,
      margin,
      sellingPrice,
      servings,
      userId,
      imageUrl: typeof imageUrl === 'string' ? imageUrl : null,
      ingredients: ingredients.map((ingredient) => this.toRecipeIngredient(ingredient)),
      categories: categories.map((category) => this.toRecipeCategory(category))
    };
  }

  private toRecipeCategory(value: unknown): RecipeCategory {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid recipe category.');
    }

    const id = this.toNumber(value['categoryId']);
    const name = value['categoryName'];
    if (id === null || typeof name !== 'string') {
      throw new Error('The API returned a recipe category with missing or invalid fields.');
    }
    return { id, name };
  }

  private toRecipeIngredient(value: unknown): RecipeIngredient {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid recipe ingredient.');
    }

    const id = this.toNumber(value['ingredientId']);
    const itemId = this.toNumber(value['itemId']);
    const quantity = this.toNumber(value['quantity'] ?? value['qty']);
    const unitId = this.toNumber(value['unitId'] ?? value['inventoryUnitId']);
    const price = this.toNumber(value['price']);
    const name = value['itemName'];
    const unitName = value['unitName'] ?? value['unit_name'];
    const stockQuantity = this.toNumber(value['stockQuantity']);
    const inventoryUnitId = this.toNumber(value['inventoryUnitId']);

    if (
      id === null || itemId === null || quantity === null || unitId === null ||
      price === null || typeof name !== 'string' ||
      (unitName !== undefined && typeof unitName !== 'string')
    ) {
      throw new Error('The API returned a recipe ingredient with missing or invalid fields.');
    }

    return {
      id,
      itemId,
      name,
      quantity,
      unitId,
      unitName: typeof unitName === 'string' ? unitName : `Unit ${unitId}`,
      stockQuantity,
      inventoryUnitId,
      price
    };
  }

  private toRecipeIngredientCost(value: unknown): RecipeIngredientCost {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid recipe ingredient cost.');
    }

    const id = this.toNumber(value['ingredientId']);
    const itemId = this.toNumber(value['itemId']);
    const quantity = this.toNumber(value['quantity'] ?? value['qty']);
    const unitId = this.toNumber(value['unitId']);
    const costPerUnit = this.toNumber(value['costPerUnit']);
    const totalCost = this.toNumber(value['totalCost']);
    const name = value['itemName'];
    const unitName = value['unitName'];

    if (
      id === null || itemId === null || quantity === null || unitId === null ||
      costPerUnit === null || totalCost === null ||
      typeof name !== 'string' || typeof unitName !== 'string'
    ) {
      throw new Error('The API returned a recipe ingredient cost with missing or invalid fields.');
    }

    return { id, itemId, name, quantity, unitId, unitName, costPerUnit, totalCost };
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
