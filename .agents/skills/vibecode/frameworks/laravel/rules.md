# Laravel Rules

Apply these on top of the generic rules when the project root has an `artisan` file.

## Version
- Read the `laravel/framework` version in `composer.lock` before writing code, and write each file the way that version's docs place it.
- Specify actively maintained PHP patch versions with no unpatched RCE advisories in `composer.json` and Docker configs, e.g. verify the PHP release patches CGI argument injection vulnerabilities before pinning.
- Scaffold a new project with the latest stable `laravel/framework`, and keep its slim skeleton: no `app/Http/Kernel.php`, `app/Console/Kernel.php`, `app/Exceptions/Handler.php`, `RouteServiceProvider`, `AuthServiceProvider` or `EventServiceProvider`.
- On a project whose `bootstrap/app.php` builds the app with `new Application(...)` (Laravel 10 and older), register middleware, schedules and exception handling in its existing kernels and handler, and report to the user that the project is on the old structure. Never move it to the new structure without the user asking.

## Directory structure
- With one area (one route group with its own layout, e.g. only a public site), keep Laravel's default `resources/views/`, `resources/js/`, `resources/css/` and `routes/web.php`.
- With 2 or more areas (e.g. `admin` and `website`), give each area its own controllers folder, resources folder, route file and view namespace; never mix two areas' views in `resources/views/` or their controllers loose in `app/Http/Controllers/`:

```text
app/
├── Enums/                              # Backed enums for fixed value sets (statuses, types)
├── Http/
│   ├── Controllers/
│   │   ├── <Area>/                     # One folder per area (Admin, Website)
│   │   │   └── <Resource>Controller.php
│   │   └── Controller.php              # Base controller only
│   ├── Middleware/                     # Only the project's own middleware
│   └── Requests/                       # Form requests, <Resource>Request.php
├── Macros/                             # Mixin classes for Builder, Collection, Str
├── Models/                             # Eloquent models, one per table
├── Providers/
│   └── AppServiceProvider.php          # Gates, macros, view and component namespaces
├── Services/                           # Logic shared by 2+ controllers (storage, uploads)
├── Support/                            # Pure helper classes (date format, money)
└── Traits/                             # Traits shared by 2+ models or controllers
bootstrap/
├── app.php                             # Routing, middleware, exceptions
└── providers.php                       # Registered service providers
resources/
├── assets/                             # JS and CSS shared by 2+ areas
├── <area>/                             # One folder per area (admin, website)
│   ├── css/                            # Area styles (sass/ when the project compiles Sass)
│   ├── images/                         # Area images
│   ├── js/                             # Area scripts, app.js entry
│   └── views/
│       ├── components/                 # Anonymous Blade components, <x-area::dialog />
│       ├── pages/
│       │   └── <resource>/             # index.blade.php plus the page's partials
│       └── shared/                     # Layout shell and its parts (layout, header, sidebar, footer)
routes/
├── <area>.php                          # One route file per area beyond web.php
├── console.php                         # Artisan closures and the task schedule
└── web.php
tests/
├── Feature/
│   └── <Area>/                         # HTTP tests per area, mirroring Controllers/<Area>/
└── Unit/
```

- Create classes with `php artisan make:<type>`, e.g. `php artisan make:controller Admin/OrderController`, so they land in the folder and namespace Laravel expects.
- Name each area's controllers `app/Http/Controllers/<Area>/<Resource>Controller.php`, e.g. `app/Http/Controllers/Admin/OrderController.php`.
- Register each area's views as a namespace in `AppServiceProvider::boot()` with `View::addNamespace('admin', resource_path('admin/views'))`, and its components with `Blade::anonymousComponentPath(resource_path('admin/views/components'), 'admin')`; render them as `view('admin::pages.order.index')` and `<x-admin::dialog />`.
- Put a page's partials (table, form steps, store dialog) in that page's folder, e.g. `resources/admin/views/pages/order/table.blade.php`; move one to `components/` when a second page uses it.
- Put each area's layout shell and the parts only it uses in that area's `views/shared/`, e.g. `resources/admin/views/shared/sidebar.blade.php`.
- Give Vite one entry per area in `vite.config.js`, e.g. `resources/admin/js/app.js`, and load only that area's entries in its layout with `@vite([...])`.
- Put an app-specific setting in its own file under `config/` and read it with `config('file.key')`; never call `env()` outside `config/`.
- Publish a framework config file with `php artisan config:publish <name>` only when you change it.

## Bootstrap and providers
- Register routing, middleware and exception handling in `bootstrap/app.php` with `->withRouting(...)`, `->withMiddleware(...)` and `->withExceptions(...)`, e.g. `$middleware->alias(['permission' => CheckPermission::class])`.
- Mount each area's route file from `->withRouting(then: ...)`, e.g. `Route::middleware('web')->prefix('admin')->name('admin.')->group(base_path('routes/admin.php'))`.
- Define scheduled tasks in `routes/console.php` with the `Schedule` facade, e.g. `Schedule::command('reports:send')->daily()`.
- List service providers in `bootstrap/providers.php`. Add a provider only when `AppServiceProvider` would hold an unrelated group of 3+ bindings.
- Define gates in `AppServiceProvider::boot()` with `Gate::define(...)`, and let Laravel discover policies in `app/Policies/` and listeners in `app/Listeners/`; never register them by hand.
- Add `routes/api.php` with `php artisan install:api` and broadcasting with `php artisan install:broadcasting`; never create their files or providers by hand.

## Routing
- Name routes with dots, `<area>.<resources>.<action>`, with the resource in plural, e.g. `admin.orders.index`; never use dashes or underscores between the parts.
- Write a CRUD resource with `Route::resource()` or `Route::controller()->group()`; never repeat the controller class on every line.
- Never put logic in a route closure in `routes/<area>.php` or `routes/web.php`; route to a controller method.

## Data flow
- Keep the request flowing one way: `route > middleware > form request > controller > service > model`. A controller that only reads and shows data calls the model directly.
- Validate input in a form request class in `app/Http/Requests/`, e.g. `public function store(OrderRequest $request)`; never call `$request->validate()` or `Validator::make()` in a controller.
- Pass a model only the validated fields with `$request->validated()`; never pass `$request->all()`.
- Put logic in a service in `app/Services/` only when 2 or more controllers run it; write logic one controller uses in that controller.
- Write query filters that 2 or more controllers use as local scopes on the model, e.g. `Order::query()->search($term)->paginate()`.

## Controllers
Apply this section on Laravel 11 and later.
- Attach controller middleware with the `HasMiddleware` interface and `public static function middleware(): array`, e.g. `new Middleware('permission:order-view', only: ['index'])`; never call `$this->middleware()` in a constructor.
- Inject dependencies with constructor property promotion, e.g. `public function __construct(private OrderService $orders) {}`.

## Models
Apply this section on Laravel 11 and later.
- Declare casts in a `protected function casts(): array` method; never in a `$casts` property.
- Write accessors and mutators as one `Attribute` method, e.g. `protected function name(): Attribute`; never as `getNameAttribute()` / `setNameAttribute()`.
