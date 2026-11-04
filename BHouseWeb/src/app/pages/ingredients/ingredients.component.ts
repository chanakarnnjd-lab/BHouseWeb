import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Ingredient, IngredientService } from '../../services/ingredient.service';

@Component({
  selector: 'app-ingredients',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './ingredients.component.html',
  styleUrl: './ingredients.component.scss'
})
export class IngredientsComponent implements OnInit {
  searchTerm = '';
  ingredients: Ingredient[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly ingredientService: IngredientService) {}

  ngOnInit(): void {
    this.ingredientService.getAll().subscribe({
      next: (ingredients) => {
        this.ingredients = ingredients;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Could not load ingredients (HTTP ${error.status}). Check the API server and try again.`
          : error instanceof Error ? error.message : 'Could not load ingredients.';
        this.loading = false;
      }
    });
  }

  get filteredIngredients(): Ingredient[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.ingredients.filter((ingredient) => `${ingredient.name} ${ingredient.unitName} ${ingredient.quantity}`.toLowerCase().includes(query));
  }

  get totalValue(): number {
    return this.ingredients.reduce((total, ingredient) => total + ingredient.price, 0);
  }
}
