import { Routes } from '@angular/router';
import { IngredientsComponent } from './pages/ingredients/ingredients.component';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { RecipesComponent } from './pages/recipes/recipes.component';
import { IngredientFormComponent } from './pages/ingredients/ingredient-form.component';
import { RecipeFormComponent } from './pages/recipes/recipe-form.component';
import { RecipeDetailComponent } from './pages/recipes/recipe-detail.component';
import { authGuard } from './services/auth.guard';
import { adminGuard } from './services/admin.guard';
import { UnitsComponent } from './pages/units/units.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'recipes', component: RecipesComponent },
      { path: 'recipes/new', component: RecipeFormComponent },
      { path: 'recipes/:id/edit', component: RecipeFormComponent },
      { path: 'recipes/:id', component: RecipeDetailComponent },
      { path: 'ingredients/new', component: IngredientFormComponent },
      { path: 'ingredients/:id/edit', component: IngredientFormComponent },
      { path: 'ingredients', component: IngredientsComponent },
      { path: 'units', component: UnitsComponent, canActivate: [adminGuard] },
      { path: 'items', redirectTo: 'ingredients', pathMatch: 'full' },
      { path: '', redirectTo: 'recipes', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
