import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Ingredient, IngredientInput, IngredientService } from '../../services/ingredient.service';

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
  missingIngredient = false;
  loading = this.isEditing;
  saving = false;
  errorMessage = '';
  name = '';
  quantity: number | null = null;
  unitId: number | null = null;
  price: number | null = null;
  userId = 'admin';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ingredientService: IngredientService
  ) {}

  ngOnInit(): void {
    if (!this.id) return;
    const id = Number(this.id);
    if (!Number.isInteger(id) || id < 1) {
      this.missingIngredient = true;
      this.loading = false;
      return;
    }

    this.ingredientService.getById(id).subscribe({
      next: (ingredient) => {
        this.setFormValues(ingredient);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.missingIngredient = true;
        } else {
          this.errorMessage = error instanceof HttpErrorResponse
            ? `Could not load this ingredient (HTTP ${error.status}). Check the API server and try again.`
            : error instanceof Error ? error.message : 'Could not load this ingredient.';
        }
      }
    });
  }

  save(): void {
    if (this.name.trim() === '' || this.quantity === null || this.unitId === null || this.price === null) return;

    const ingredient: IngredientInput = {
      name: this.name.trim(),
      qty: this.quantity,
      unitId: this.unitId,
      price: this.price,
      userId: this.userId.trim()
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
    this.price = ingredient.price;
    this.userId = ingredient.userId;
  }
}
