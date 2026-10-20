# Python Rules

Apply these on top of the generic rules when the project root has a `pyproject.toml`, `requirements.txt`, or `setup.py`.

## Directory structure (src-layout)
- Put all application code inside a `src/<package_name>/` directory; never place application source files directly in the project root, e.g. `src/myapp/services/auth_service.py`.
- Structure domain packages with their own models, services, and route handlers, e.g. `src/myapp/billing/models.py`.
- Put configuration and environment schemas in `src/<package_name>/core/config.py` using `pydantic-settings` or dataclasses; never read raw `os.environ` in domain services.

## Type annotations
- Annotate all function parameters and return types explicitly; never write untyped function signatures, e.g. `def calculate_total(items: list[Item]) -> Decimal:`.
- Use standard collection types (`list[str]`, `dict[str, Any]`, `tuple[int, ...]`) instead of importing from `typing` on Python 3.9+.
- Use `T | None` instead of `Optional[T]` for nullable values.

## Error handling
- Define domain-specific custom exceptions inheriting from an application base exception; never raise bare `Exception`, e.g. `class OrderNotFoundError(AppError): pass`.
- Catch specific exceptions only; never write bare `except:` or `except Exception:` unless logging and re-raising.
- Always manage files, database sessions, and network connections with context managers (`with` / `async with`).

## Code style and dependencies
- Define models and transfer objects using Pydantic `BaseModel` or `@dataclass(frozen=True)`; never pass untyped dictionaries between application layers.
- Declare dependencies and project metadata in `pyproject.toml`; keep lockfiles committed and never install packages outside virtual environments.

