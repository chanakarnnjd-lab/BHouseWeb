# BHouseWeb

Save recipes, organize ingredient prices, and calculate recipe costs and selling prices.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

The Ingredients page uses the API documented at `http://localhost:3000/api-docs`. Start the API server before using it. During development, `/api` requests are forwarded to `http://localhost:3000` by `proxy.conf.json`.

Ingredient data is read from `GET /api/ingredient` and `GET /api/ingredient/byId/:id`, created with `POST /api/ingredient`, and updated with `PUT /api/ingredient/:id`. Account creation uses `POST /api/auth/register` with name, email, and password. Sign-in uses `POST /api/auth/login`, stores the returned JWT in session storage, and sends it as a Bearer token on subsequent API requests. Signing out clears the stored token. The API requires a numeric unit ID; use a unit ID configured by the backend.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
