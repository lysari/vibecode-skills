# NestJS Rules

Apply these on top of the generic rules when the project root has a `nest-cli.json`.

## Directory structure
- Structure the application into domain modules under `src/<domain>/` (or `src/modules/<domain>/`), each with its own `<domain>.module.ts`, `<domain>.controller.ts`, `<domain>.service.ts`, and `dto/`, e.g. `src/orders/orders.module.ts`.
- Put cross-cutting infrastructure (database configurations, global interceptors, exception filters, auth guards) in `src/core/` or `src/common/`, e.g. `src/core/guards/jwt-auth.guard.ts`.
- Keep the root `AppModule` in `src/app.module.ts` limited to registering domain modules and global configuration; never place route endpoints directly in `app.controller.ts`.

## Controllers and DTOs
- Keep controllers thin: validate incoming parameters via DTOs and return service responses; never write database queries or business algorithms inside a controller method.
- Define every request body and query payload as a class with `class-validator` decorators in `dto/<action>-<entity>.dto.ts`, e.g. `dto/create-order.dto.ts`.
- Always enable `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true }` so extraneous properties are stripped automatically.

## Services and dependency injection
- Mark business logic classes with `@Injectable()` and inject dependencies via constructor injection; never instantiate services manually with `new`.
- Keep services private to their owning module; export a service in `exports: [...]` only when another module's service explicitly injects it.
- Throw NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`) from services to ensure standardized error responses.

