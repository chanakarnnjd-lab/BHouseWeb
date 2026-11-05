import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unitId: number;
  unitName: string;
  price: number;
  userId: string;
}

export interface IngredientInput {
  name: string;
  price: number;
  unitId: number;
  qty: number;
  userId: string;
}

interface ApiEnvelope {
  success: boolean;
  message?: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class IngredientService {
  constructor(private readonly api: ApiService) {}

  getAll(): Observable<Ingredient[]> {
    return this.api.get<ApiEnvelope>('ingredient').pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'The API returned an invalid ingredient list.');
        }
        return response.data.map((record) => this.toIngredient(record));
      })
    );
  }

  getById(id: number): Observable<Ingredient> {
    return this.api.get<ApiEnvelope>(`ingredient/byId/${id}`).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'The API could not find this ingredient.');
        }
        return this.toIngredient(response.data);
      })
    );
  }

  create(ingredient: IngredientInput): Observable<unknown> {
    return this.api.post<unknown>('ingredient', ingredient);
  }

  update(id: number, ingredient: IngredientInput): Observable<unknown> {
    return this.api.put<unknown>(`ingredient/${id}`, ingredient);
  }

  private toIngredient(value: unknown): Ingredient {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid ingredient record.');
    }

    const id = this.toNumber(value['itemId']);
    const quantity = this.toNumber(value['qty']);
    const unitId = this.toNumber(value['unitId']);
    const price = this.toNumber(value['price']);
    const name = value['itemName'];
    const unitName = value['unitName'];
    const userId = value['userId'];

    if (
      id === null || quantity === null || unitId === null || price === null ||
      typeof name !== 'string' || typeof userId !== 'string' ||
      (unitName !== undefined && typeof unitName !== 'string')
    ) {
      throw new Error('The API returned an ingredient with missing or invalid fields.');
    }

    return {
      id,
      name,
      quantity,
      unitId,
      unitName: unitName ?? `Unit ${unitId}`,
      price,
      userId
    };
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
