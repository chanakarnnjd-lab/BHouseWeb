import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Unit, UnitInput, UnitService } from '../../services/unit.service';

interface UnitTreeRow {
  unit: Unit;
  level: number;
}

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './units.component.html',
  styleUrl: './units.component.scss'
})
export class UnitsComponent implements OnInit {
  units: Unit[] = [];
  loading = true;
  saving = false;
  deletingId: number | null = null;
  editingId: number | null = null;
  editorOpen = false;
  unitName = '';
  parentId: number | null = null;
  conversionFactor: number | null = null;
  errorMessage = '';
  editorErrorMessage = '';

  constructor(private readonly unitService: UnitService) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  get treeRows(): UnitTreeRow[] {
    const children = new Map<number, Unit[]>();
    const roots: Unit[] = [];
    const knownIds = new Set(this.units.map((unit) => unit.unitId));
    for (const unit of this.units) {
      if (unit.parentId === null || !knownIds.has(unit.parentId)) {
        roots.push(unit);
      } else {
        const siblings = children.get(unit.parentId) ?? [];
        siblings.push(unit);
        children.set(unit.parentId, siblings);
      }
    }

    const rows: UnitTreeRow[] = [];
    const visited = new Set<number>();
    const append = (unit: Unit, level: number): void => {
      if (visited.has(unit.unitId)) return;
      visited.add(unit.unitId);
      rows.push({ unit, level });
      for (const child of children.get(unit.unitId) ?? []) append(child, level + 1);
    };

    for (const root of roots) append(root, 0);
    for (const unit of this.units) append(unit, 0);
    return rows;
  }

  get parentOptions(): Unit[] {
    const excludedIds = new Set<number>();
    if (this.editingId !== null) {
      excludedIds.add(this.editingId);
      let foundNewDescendant = true;
      while (foundNewDescendant) {
        foundNewDescendant = false;
        for (const unit of this.units) {
          if (unit.parentId !== null && excludedIds.has(unit.parentId) && !excludedIds.has(unit.unitId)) {
            excludedIds.add(unit.unitId);
            foundNewDescendant = true;
          }
        }
      }
    }
    return this.units.filter((unit) => !excludedIds.has(unit.unitId));
  }

  startCreate(): void {
    this.editingId = null;
    this.unitName = '';
    this.parentId = null;
    this.conversionFactor = null;
    this.editorErrorMessage = '';
    this.editorOpen = true;
  }

  startEdit(unit: Unit): void {
    this.editingId = unit.unitId;
    this.unitName = unit.unitName;
    this.parentId = unit.parentId;
    this.conversionFactor = unit.N;
    this.editorErrorMessage = '';
    this.editorOpen = true;
  }

  cancelEdit(): void {
    this.editorOpen = false;
    this.editorErrorMessage = '';
  }

  save(): void {
    const name = this.unitName.trim();
    if (!name || name.length > 100) {
      this.editorErrorMessage = 'Enter a unit name of up to 100 characters.';
      return;
    }
    if (
      this.conversionFactor !== null &&
      (!Number.isInteger(this.conversionFactor) || this.conversionFactor < 1)
    ) {
      this.editorErrorMessage = 'The conversion factor must be a positive whole number.';
      return;
    }

    const unit: UnitInput = {
      unitName: name,
      parentId: this.parentId,
      N: this.conversionFactor
    };
    this.saving = true;
    this.editorErrorMessage = '';
    const request = this.editingId === null
      ? this.unitService.create(unit)
      : this.unitService.update(this.editingId, unit);

    request.subscribe({
      next: (savedUnit) => {
        if (this.editingId === null) this.units = [...this.units, savedUnit];
        else this.units = this.units.map((item) => item.unitId === savedUnit.unitId ? savedUnit : item);
        this.saving = false;
        this.editorOpen = false;
      },
      error: (error: unknown) => {
        this.saving = false;
        this.editorErrorMessage = this.getErrorMessage(error, 'save');
      }
    });
  }

  delete(unit: Unit): void {
    if (!window.confirm(`Delete "${unit.unitName}"? Units used by ingredients or child units cannot be deleted.`)) return;

    this.deletingId = unit.unitId;
    this.errorMessage = '';
    this.unitService.delete(unit.unitId).subscribe({
      next: () => {
        this.units = this.units.filter((item) => item.unitId !== unit.unitId);
        this.deletingId = null;
        if (this.editingId === unit.unitId) this.cancelEdit();
      },
      error: (error: unknown) => {
        this.deletingId = null;
        this.errorMessage = this.getErrorMessage(error, 'delete');
      }
    });
  }

  parentName(parentId: number | null): string {
    return this.units.find((unit) => unit.unitId === parentId)?.unitName ?? 'Base unit';
  }

  private loadUnits(): void {
    this.loading = true;
    this.errorMessage = '';
    this.unitService.getAll().subscribe({
      next: (units) => {
        this.units = units;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error, 'load');
      }
    });
  }

  private getErrorMessage(error: unknown, action: 'load' | 'save' | 'delete'): string {
    const operation = { load: 'load units', save: 'save this unit', delete: 'delete this unit' }[action];
    return error instanceof HttpErrorResponse
      ? `Could not ${operation} (HTTP ${error.status}). Check your admin access and try again.`
      : error instanceof Error ? error.message : `Could not ${operation}.`;
  }
}
