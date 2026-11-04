import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Ingredient, IngredientService } from '../../services/ingredient.service';
import { Recipe, RecipeInput, RecipeService } from '../../services/recipe.service';

interface RecipeIngredientRow {
  itemId: number | null;
  quantity: number | null;
}

interface CompleteRecipeIngredientRow {
  itemId: number;
  quantity: number;
}

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss'
})
export class RecipeFormComponent implements OnInit {
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly isEditing = this.id !== null;
  readonly userId = 'admin';
  ingredients: Ingredient[] = [];
  ingredientRows: RecipeIngredientRow[] = [this.newIngredientRow()];
  missingRecipe = false;
  loading = true;
  saving = false;
  errorMessage = '';
  menu = '';
  margin: number | null = null;
  additionalCostPerUnit: number | null = null;
  servings: number | null = null;
  imageUrl = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly recipeService: RecipeService,
    private readonly ingredientService: IngredientService
  ) {}

  ngOnInit(): void {
    if (!this.id) {
      this.loadIngredients();
      return;
    }

    const id = Number(this.id);
    if (!Number.isInteger(id) || id < 1) {
      this.missingRecipe = true;
      return;
    }

    this.loading = true;
    forkJoin({
      recipe: this.recipeService.getById(id),
      ingredients: this.ingredientService.getAll()
    }).subscribe({
      next: ({ recipe, ingredients }) => {
        this.ingredients = ingredients;
        this.setFormValues(recipe);
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.missingRecipe = true;
        } else {
          this.errorMessage = this.getErrorMessage(error, 'load');
        }
      }
    });
  }

  addIngredient(): void {
    this.ingredientRows.push(this.newIngredientRow());
  }

  removeIngredient(index: number): void {
    if (this.ingredientRows.length > 1) {
      this.ingredientRows.splice(index, 1);
    } else {
      this.ingredientRows[0] = this.newIngredientRow();
    }
  }

  save(): void {
    if (
      this.menu.trim() === '' || this.margin === null || this.additionalCostPerUnit === null ||
      !Number.isInteger(this.margin) || this.margin < 0 ||
      this.additionalCostPerUnit <= 0 ||
      this.servings === null || !Number.isInteger(this.servings) || this.servings < 1 ||
      !this.ingredientRows.every(this.isCompleteIngredientRow)
    ) {
      return;
    }

    const ingredientRows: CompleteRecipeIngredientRow[] = this.ingredientRows;
    const recipe: RecipeInput = {
      menu: this.menu.trim(),
      margin: this.margin,
      acc_unit: this.additionalCostPerUnit,
      serve: this.servings,
      userId: this.userId,
      picUrl: this.imageUrl.trim() || null,
      ingredients: ingredientRows.map((row) => ({
        itemId: row.itemId,
        qty: row.quantity
      }))
    };

    this.saving = true;
    this.errorMessage = '';
    const request = this.id
      ? this.recipeService.update(Number(this.id), recipe)
      : this.recipeService.create(recipe);

    request.subscribe({
      next: () => this.router.navigate(['/recipes']),
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = this.getErrorMessage(error, 'save');
      }
    });
  }

  private loadIngredients(): void {
    this.ingredientService.getAll().subscribe({
      next: (ingredients) => {
        this.ingredients = ingredients;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Could not load ingredients (HTTP ${error.status}). Check the API server and try again.`
          : error instanceof Error ? error.message : 'Could not load ingredients.';
      }
    });
  }

  private setFormValues(recipe: Recipe): void {
    this.menu = recipe.menu;
    this.margin = recipe.margin;
    this.additionalCostPerUnit = recipe.additionalCostPerUnit;
    this.servings = recipe.servings;
    this.imageUrl = recipe.imageUrl ?? '';
    this.ingredientRows = recipe.ingredients.length
      ? recipe.ingredients.map((ingredient) => ({ itemId: ingredient.itemId, quantity: ingredient.quantity }))
      : [this.newIngredientRow()];
  }

  private newIngredientRow(): RecipeIngredientRow {
    return { itemId: null, quantity: null };
  }

  private isCompleteIngredientRow(row: RecipeIngredientRow): row is CompleteRecipeIngredientRow {
    return row.itemId !== null && Number.isInteger(row.itemId) &&
      row.quantity !== null && Number.isInteger(row.quantity) && row.quantity >= 1;
  }

  private getErrorMessage(error: unknown, action: 'load' | 'save'): string {
    const operation = action === 'load' ? 'load' : 'save';
    return error instanceof HttpErrorResponse
      ? `Could not ${operation} this recipe (HTTP ${error.status}). Check the API server and try again.`
      : error instanceof Error ? error.message : `Could not ${operation} this recipe.`;
  }
}
