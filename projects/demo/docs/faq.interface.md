# FAQ Interface

Documentation for `src/app/shared/interfaces/faq.interface.ts`.

## `IFaqItem`

Defines knowledge base entries matched and offered by the interactive chatbot assistant:
- `key`: Unique identifier string used for deduplication and tracking.
- `question`: User-facing query text displayed in quick suggestion chips.
- `answer`: Pre-composed assistant response rendered when a question is chosen or matched.
- `icon` (optional): Icon identifier associated with the topic.

