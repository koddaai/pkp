# Skills

PKP Skills are specialized system prompts for AI assistants. They help AI agents provide expert guidance for specific product categories or use cases.

## Installation

```bash
npm install @pkprotocol/skills
```

## Available Skills

| Skill | Purpose |
|-------|---------|
| `consumer` | General product assistant |
| `smartphones` | Smartphone specialist |
| `notebooks` | Laptop/notebook specialist |
| `product-explainer` | Translates tech specs to plain language |

## Usage

### TypeScript/JavaScript

```typescript
import {
  CONSUMER_SKILL,
  SMARTPHONES_SKILL,
  NOTEBOOKS_SKILL,
  PRODUCT_EXPLAINER_SKILL,
  getSkill,
  listSkills
} from "@pkprotocol/skills";

// Use in your AI application
const systemPrompt = CONSUMER_SKILL.systemPrompt;

// Get skill by name
const skill = getSkill("smartphones");

// List all skills
const skills = listSkills();
// [{ name: "pkp-consumer", description: "..." }, ...]
```

### With Claude API

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { CONSUMER_SKILL } from "@pkprotocol/skills";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: CONSUMER_SKILL.systemPrompt,
  messages: [
    { role: "user", content: "Compare the latest iPhones" }
  ]
});
```

### With MCP Server

Use skills together with the Catalog Server for a complete product assistant:

```json
{
  "mcpServers": {
    "pkp-catalog": {
      "command": "pkp-catalog-server",
      "args": ["./catalog"]
    }
  }
}
```

Then provide the skill as the system prompt in your application.

## Skill Details

### Consumer Skill

General-purpose product assistant for any category.

**Capabilities:**
- Search products by name, category, or features
- Compare products side-by-side
- Recommend products based on user needs
- Explain technical specifications
- Answer product questions using FAQ data

**Best for:** Shopping assistants, product recommendation bots

```typescript
import { CONSUMER_SKILL } from "@pkprotocol/skills";

console.log(CONSUMER_SKILL.name);        // "pkp-consumer"
console.log(CONSUMER_SKILL.description); // "General product assistant..."
console.log(CONSUMER_SKILL.systemPrompt); // Full prompt text
```

### Smartphones Skill

Specialist for mobile phones and smartphones.

**Capabilities:**
- Deep knowledge of smartphone specs (SOC, camera systems, displays)
- Compare camera capabilities
- Explain processor benchmarks
- Battery life analysis
- Network band compatibility

**Best for:** Phone buying guides, tech review sites

```typescript
import { SMARTPHONES_SKILL } from "@pkprotocol/skills";
```

### Notebooks Skill

Specialist for laptops and notebooks.

**Capabilities:**
- Understand workload requirements (gaming, creative, business)
- Compare CPU/GPU performance
- Explain display technologies
- Battery life vs performance tradeoffs
- Port and connectivity analysis

**Best for:** Laptop buying guides, business IT procurement

```typescript
import { NOTEBOOKS_SKILL } from "@pkprotocol/skills";
```

### Product Explainer Skill

Translates technical specifications into user-friendly language.

**Capabilities:**
- Explain what specs mean in practical terms
- Convert numbers to real-world benefits
- Highlight what matters for different use cases
- Avoid jargon

**Best for:** Non-technical audiences, consumer education

```typescript
import { PRODUCT_EXPLAINER_SKILL } from "@pkprotocol/skills";
```

## Skill Interface

All skills implement the `PKPSkill` interface:

```typescript
interface PKPSkill {
  name: string;
  description: string;
  systemPrompt: string;
  examplePrompts?: Array<{
    name: string;
    description: string;
    template: string;
  }>;
}
```

## Confidence Awareness

All PKP skills are trained to respect data confidence levels:

```
- "manufacturer" = highly reliable
- "retailer-feed" = generally reliable
- "community" = verify if critical
- "ai-generated" = may have errors
- "scraped" = treat with caution
```

Skills will mention when data has low confidence so users can make informed decisions.

## Creating Custom Skills

You can create your own skills following the same pattern:

```typescript
import type { PKPSkill } from "@pkprotocol/skills";

export const MY_CUSTOM_SKILL: PKPSkill = {
  name: "my-custom-skill",
  description: "Specialist for my product category",
  systemPrompt: `You are an expert in...

## Your Capabilities
1. ...
2. ...

## Response Guidelines
- ...
`,
  examplePrompts: [
    {
      name: "compare",
      description: "Compare two products",
      template: "Compare {product1} and {product2}"
    }
  ]
};
```

## Example Conversation

Using the Consumer Skill with Catalog Server:

```
User: I need a new phone with a great camera under R$5000
Assistant: [Uses search_products tool]

Based on your budget and camera needs, I found these options:

1. **Pixel 9 Pro** - R$4,999
   - 50MP main camera with Magic Eraser
   - Best-in-class computational photography
   
2. **Galaxy A55** - R$2,499  
   - 50MP camera, good low-light
   - Great value option

Would you like me to compare these in detail?
```

