import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Recipe, RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss'
})
export class RecipesComponent implements OnInit {
  searchTerm = '';
  recipes: Recipe[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly recipeService: RecipeService) {}

  ngOnInit(): void {
    this.recipeService.getAll().subscribe({
      next: (recipes) => {
        this.recipes = recipes;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Could not load recipes (HTTP ${error.status}). Check the API server and try again.`
          : error instanceof Error ? error.message : 'Could not load recipes.';
        this.loading = false;
      }
    });
  }

  get filteredRecipes(): Recipe[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.recipes.filter((recipe) =>
      `${recipe.menu} ${recipe.ingredients.map((ingredient) => ingredient.name).join(' ')}`.toLowerCase().includes(query)
    );
  }
}
