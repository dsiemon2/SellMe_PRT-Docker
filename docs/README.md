# SellMePRT - Western Ware Sales Training AI

**Type:** Sales Training Application (Western Wear)
**Port:** 8086
**URL Prefix:** `/SellMePRT/`

---

## Quick Start

```bash
# Start the application
docker compose up -d

# Access URLs
# Chat: http://localhost:8086/SellMePRT/
# Admin: http://localhost:8086/SellMePRT/admin?token=admin
```

---

## Features Overview

### Sales Training
- **Sessions** - Practice western wear sales conversations
- **Products** - Western wear inventory (boots, hats, apparel)
- **Techniques** - Retail sales methodology
- **Discovery Questions** - Customer needs assessment
- **Closing Strategies** - Deal closing techniques
- **Objection Handling** - Response to customer concerns

### AI Configuration
- AI Config settings
- Knowledge Base
- Greeting customization

---

## Database Schema

### Key Models
- `Session` - Sales practice sessions
- `Product` - Western wear inventory
- `SalesTechnique` - Sales methodologies
- `DiscoveryQuestion` - Assessment questions
- `ClosingStrategy` - Closing techniques
- `Objection` - Common objections and responses

---

## Color Theme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Western Brown | `#b45309` |
| Secondary | Dark Brown | `#a16207` |
| Accent | Amber | `#d97706` |

---

## Related Documentation

- [CLAUDE.md](../../../CLAUDE.md) - Master reference
- [THEMING.md](../../../THEMING.md) - Theming guide
- [DATABASE-SCHEMAS.md](../../../DATABASE-SCHEMAS.md) - Full schemas
- [SAMPLE-DATA.md](../../../SAMPLE-DATA.md) - Sample data
