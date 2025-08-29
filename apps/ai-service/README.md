# AI Service

NestJS microservice for AI-powered ticket analysis and automation.

## Features

- **Ticket Analysis** - Sentiment analysis, urgency scoring, categorization
- **Smart Suggestions** - AI-generated response templates
- **Topic Extraction** - Key topic identification from ticket content
- **Priority Scoring** - Intelligent priority recommendations
- **Cloudflare Workers AI** - Integration ready for production AI models

## Environment Variables

Copy `.env.example` to `.env`:

```env
# Cloudflare Workers AI (Optional)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Application
PORT=3002
NODE_ENV=development
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## API Endpoints

### AI Analysis
- `POST /api/v1/ai/analyze` - Analyze ticket content
- `POST /api/v1/ai/generate-response` - Generate suggested response

## AI Capabilities

### Current Implementation (Mock)
- Sentiment analysis using keyword matching
- Category suggestion based on content keywords
- Priority scoring based on urgency indicators
- Topic extraction using word frequency
- Response generation with context-aware templates

### Production Integration
The service is designed to integrate with Cloudflare Workers AI:

```typescript
// Example integration
import { CloudflareWorkersAI } from '@langchain/cloudflare';

const model = new CloudflareWorkersAI({
  model: '@cf/meta/llama-2-7b-chat-int8',
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
});
```

## Analysis Output

The AI service returns structured analysis:

```json
{
  "ticketId": "uuid",
  "sentiment": "positive|neutral|negative",
  "urgencyScore": 0.85,
  "suggestedCategory": "technical",
  "suggestedPriority": "high",
  "keyTopics": ["login", "error", "database"],
  "suggestedResponse": "AI-generated response template",
  "confidence": 0.85,
  "processedAt": "2024-01-01T00:00:00.000Z"
}
```
