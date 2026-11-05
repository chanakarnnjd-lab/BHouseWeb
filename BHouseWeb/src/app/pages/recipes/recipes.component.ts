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
  selectedCategory = 'all';
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

  get categories(): Recipe['categories'] {
    const categories = new Map<number, Recipe['categories'][number]>();
    for (const recipe of this.recipes) {
      for (const category of recipe.categories) {
        categories.set(category.id, category);
      }
    }
    return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  get filteredRecipes(): Recipe[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.recipes.filter((recipe) => {
      const matchesSearch = `${recipe.menu} ${recipe.ingredients.map((ingredient) => ingredient.name).join(' ')} ${recipe.categories.map((category) => category.name).join(' ')}`
        .toLowerCase()
        .includes(query);
      const matchesCategory = this.selectedCategory === 'all' ||
        (this.selectedCategory === 'uncategorized'
          ? recipe.categories.length === 0
          : recipe.categories.some((category) => String(category.id) === this.selectedCategory));
      return matchesSearch && matchesCategory;
    });
  }
}
