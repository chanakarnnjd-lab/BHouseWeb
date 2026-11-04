import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Recipe, RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss'
})
export class RecipeDetailComponent implements OnInit {
  recipe: Recipe | null = null;
  loading = true;
  deleting = false;
  missingRecipe = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly recipeService: RecipeService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.missingRecipe = true;
      this.loading = false;
      return;
    }

    this.recipeService.getById(id).subscribe({
      next: (recipe) => {
        this.recipe = recipe;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.missingRecipe = true;
        } else {
          this.errorMessage = error instanceof HttpErrorResponse
            ? `Could not load this recipe (HTTP ${error.status}). Check the API server and try again.`
            : error instanceof Error ? error.message : 'Could not load this recipe.';
        }
      }
    });
  }

  deleteRecipe(): void {
    if (!this.recipe || this.deleting) return;
    if (!window.confirm(`Delete "${this.recipe.menu}"? This action cannot be undone.`)) return;

    this.deleting = true;
    this.errorMessage = '';
    this.recipeService.delete(this.recipe.id).subscribe({
      next: () => this.router.navigate(['/recipes']),
      error: (error: unknown) => {
        this.deleting = false;
        this.errorMessage = error instanceof HttpErrorResponse
          ? `Could not delete this recipe (HTTP ${error.status}). Check the API server and try again.`
          : error instanceof Error ? error.message : 'Could not delete this recipe.';
      }
    });
  }
}
