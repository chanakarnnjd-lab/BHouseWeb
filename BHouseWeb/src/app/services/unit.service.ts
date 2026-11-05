import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Unit {
  unitId: number;
  parentId: number | null;
  unitName: string;
  N: number | null;
}

export interface UnitInput {
  unitName: string;
  parentId: number | null;
  N: number | null;
}

interface ApiEnvelope {
  success: boolean;
  message?: string;
  data?: unknown;
}

@Injectable({ providedIn: 'root' })
export class UnitService {
  constructor(private readonly api: ApiService) {}

  getAll(): Observable<Unit[]> {
    return this.api.get<ApiEnvelope>('units').pipe(
      map((response) => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'The API returned an invalid unit list.');
        }
        return response.data.map((record) => this.toUnit(record));
      })
    );
  }

  create(unit: UnitInput): Observable<Unit> {
    return this.api.post<ApiEnvelope>('units', unit).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Could not create this unit.');
        }
        return this.toUnit(response.data);
      })
    );
  }

  update(id: number, unit: UnitInput): Observable<Unit> {
    return this.api.put<ApiEnvelope>(`units/${id}`, unit).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Could not update this unit.');
        }
        return this.toUnit(response.data);
      })
    );
  }

  delete(id: number): Observable<unknown> {
    return this.api.delete<ApiEnvelope>(`units/${id}`).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Could not delete this unit.');
        }
        return response;
      })
    );
  }

  private toUnit(value: unknown): Unit {
    if (!this.isRecord(value)) {
      throw new Error('The API returned an invalid unit.');
    }

    const unitId = this.toInteger(value['unitId']);
    const parentId = value['parentId'] === null ? null : this.toInteger(value['parentId']);
    const factor = value['N'] === null || value['N'] === undefined ? null : this.toInteger(value['N']);
    const unitName = value['unitName'];

    if (
      unitId === null ||
      (value['parentId'] !== null && parentId === null) ||
      (value['N'] !== null && value['N'] !== undefined && factor === null) ||
      typeof unitName !== 'string'
    ) {
      throw new Error('The API returned a unit with missing or invalid fields.');
    }

    return { unitId, parentId, unitName, N: factor };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toInteger(value: unknown): number | null {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
}
