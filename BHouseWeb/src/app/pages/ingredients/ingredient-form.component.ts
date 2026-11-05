import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Ingredient, IngredientInput, IngredientService } from '../../services/ingredient.service';
import { AuthService } from '../../services/auth.service';
import { Unit, UnitService } from '../../services/unit.service';

@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ingredient-form.component.html',
  styleUrl: './ingredient-form.component.scss'
})
export class IngredientFormComponent implements OnInit {
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isEditing = this.id !== null;
  units: Unit[] = [];
  missingIngredient = false;
  loading = true;
  saving = false;
  errorMessage = '';
  name = '';
  quantity: number | null = null;
  unitId: number | null = null;
  unitSearch = '';
  unitOptionsOpen = false;
  price: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ingredientService: IngredientService,
    private readonly authService: AuthService,
    private readonly unitService: UnitService
  ) {}

  ngOnInit(): void {
    const id = this.id === null ? null : Number(this.id);
    if (this.id !== null && (id === null || !Number.isInteger(id) || id < 1)) {
      this.missingIngredient = true;
      this.loading = false;
      return;
    }

    forkJoin({
      units: this.unitService.getAll(),
      ingredient: id === null ? of(null) : this.ingredientService.getById(id)
    }).subscribe({
      next: ({ units, ingredient }) => {
        this.units = units;
        if (ingredient) this.setFormValues(ingredient);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        if (this.isEditing && error instanceof HttpErrorResponse && error.status === 404) {
          this.missingIngredient = true;
        } else {
          this.errorMessage = error instanceof HttpErrorResponse
            ? `Could not load form data (HTTP ${error.status}). Check the API server and try again.`
            : error instanceof Error ? error.message : 'Could not load form data.';
        }
      }
    });
  }

  get filteredUnits(): Unit[] {
    const query = this.unitSearch.trim().toLocaleLowerCase();
    return this.units.filter((unit) => unit.unitName.toLocaleLowerCase().includes(query));
  }

  searchUnits(value: string): void {
    this.unitSearch = value;
    this.unitId = null;
    this.unitOptionsOpen = true;
  }

  selectUnit(unit: Unit): void {
    this.unitId = unit.unitId;
    this.unitSearch = unit.unitName;
    this.unitOptionsOpen = false;
  }

  save(): void {
    if (this.name.trim() === '' || this.quantity === null || this.unitId === null || this.price === null) return;

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.errorMessage = 'Could not identify the signed-in user. Please sign in again.';
      return;
    }

    const ingredient: IngredientInput = {
      name: this.name.trim(),
      qty: this.quantity,
      unitId: this.unitId,
      price: this.price,
      userId
    };

    this.saving = true;
    this.errorMessage = '';
    const request = this.id
      ? this.ingredientService.update(Number(this.id), ingredient)
      : this.ingredientService.create(ingredient);

    request.subscribe({
      next: () => this.router.navigate(['/ingredients']),
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Could not save this ingredient (HTTP ${error.status}). Check the API server and try again.`
          : error instanceof Error ? error.message : 'Could not save this ingredient.';
      }
    });
  }

  private setFormValues(ingredient: Ingredient): void {
    this.name = ingredient.name;
    this.quantity = ingredient.quantity;
    this.unitId = ingredient.unitId;
    this.unitSearch = this.units.find((unit) => unit.unitId === ingredient.unitId)?.unitName ?? '';
    this.price = ingredient.price;
  }
}
