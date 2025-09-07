```markdown
## Conversation Module Overview

The Conversation module provides functionalities to manage and retrieve the history of user interactions with AI models. It aggregates individual Gemini API requests and responses into coherent conversational threads, allowing users to review past dialogues and maintain context across multiple interactions.

### Key Features

- **Conversation Summaries:** Retrieve a paginated list of all conversations, showing a preview of the first and last messages, and the last update time.
- **Detailed History Retrieval:** Fetch the complete request and response history for a specific conversation, including user prompts, AI responses, and any attached multimodal data (images, files).
- **Context Preservation:** Enables AI models to maintain context by linking subsequent requests to an ongoing conversation ID.
- **Filtering and Search:** Supports filtering conversations by `requestType` (e.g., `TEXT_ONLY`, `TEXT_WITH_IMAGE`, `LLM_GENERATION`) and searching by text content in the first prompt.
- **Database Persistence:** All AI requests and responses are stored in the database, forming the basis for conversation history.

### Core Components

- [`ConversationController`](./conversation.controller.ts): Handles HTTP API endpoints for retrieving conversation lists and specific conversation histories.
- [`ConversationService`](./conversation.service.ts): Contains the core business logic for querying `GeminiRequest` and `GeminiResponse` records, grouping them by `conversationId`, and structuring them into `ConversationSummaryDto` and `ConversationHistoryItemDto`.
- [`ConversationHistoryItemDto`](./dto/conversation-history-item.dto.ts): Defines the structure for individual messages (user or model) within a conversation history, including text, inline data (images/files), and timestamps.
- [`ConversationSummaryDto`](./dto/conversation-history-item.dto.ts): Defines the structure for a high-level overview of a conversation, including ID, request count, and previews of the first/last prompts.

### Dependencies

The module relies on the following key dependencies:

- `PrismaService`: For database interactions with the `GeminiRequest` and `GeminiResponse` models, which store the raw AI interaction data.
- `AuthModule`: For authenticating requests and ensuring that only the owning user can access their conversations.
- `RequestType` (from Prisma): An enum used to categorize different types of AI requests, enabling filtering and better understanding of conversation context.
```
