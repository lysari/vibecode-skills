# Chatbot Component

Interactive conversational AI assistant widget providing immediate knowledge-base search, FAQ question chips, and typing simulation.

## Features

- **FAQ Matching Engine**: Analyzes incoming user text queries against `FAQ_ITEMS`, scoring matching keywords (excluding stop words) with heavier weight on question text.
- **Dynamic Quick Suggestions**: Shows one-tap pill buttons for unanswered knowledge base topics that automatically dismiss when picked.
- **Typing Simulation**: Emulates natural assistant delay with animated bouncing dot indicators before rendering replies.
- **Auto-scroll Mechanics**: Smoothly navigates the message log container to bottom upon each new exchange.
- **Menu Popup Persistence**: Built to sit in `<x-liquid-menu-popup>` with state retention across open and close cycles.

## Component API

- `messages`: Signal array of `{ id, from: 'bot' | 'user', text }` records.
- `draft`: Model signal holding currently entered query.
- `isTyping`: Signal indicating active response preparation.
- `suggestions`: Computed signal of unasked FAQ items.
- `send()`: Dispatches current draft text.
- `pick(faq: IFaqItem)`: Dispatches clicked FAQ query.
- `clearHistory()`: Resets conversation back to initial welcome message.

