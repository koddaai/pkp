# PKP Custom GPT - Consultor de Produtos Brasil

Este diretorio contem a configuracao para criar um Custom GPT no ChatGPT que consulta o catalogo PKP.

## Como Criar o GPT

### 1. Acesse o GPT Builder

Va para: https://chat.openai.com/gpts/editor

### 2. Configure o GPT

**Name:**
```
PKP - Consultor de Produtos Brasil
```

**Description:**
```
Encontre e compare produtos brasileiros. 77.000+ produtos de Samsung, LG, Kabum, Adidas, Centauro e mais. Busque por nome, marca ou categoria.
```

**Instructions:**
Copie o conteudo de `instructions.md`

### 3. Configure as Actions

1. Clique em "Create new action"
2. Copie o conteudo de `openapi.json` no campo "Schema"
3. Deixe "Authentication" como "None"
4. Privacy policy: `https://pkp.kodda.ai/privacy` (criar depois)

### 4. Configure Conversation Starters

Adicione:
- "Me indica um notebook bom para programar"
- "Compara Galaxy S25 com iPhone 16"
- "Qual o melhor fone bluetooth ate R$500?"
- "Quais TVs 4K tem no catalogo?"

### 5. Publique

1. Clique em "Save" (canto superior direito)
2. Escolha visibilidade:
   - "Only me" para testar
   - "Anyone with the link" para compartilhar
   - "Everyone" para publicar no GPT Store

## Testar Localmente

```bash
# Teste a API diretamente
curl "https://pkp-studio.vercel.app/api/products?search=notebook&limit=5"

# Teste com filtro de categoria
curl "https://pkp-studio.vercel.app/api/products?category=tvs&limit=10"

# Teste com filtro de marca
curl "https://pkp-studio.vercel.app/api/products?brand=Samsung&limit=10"
```

## Arquivos

- `instructions.md` - System prompt do GPT
- `openapi.json` - Schema OpenAPI para Actions
- `README.md` - Este arquivo

## Melhorias Futuras

- [ ] Adicionar filtro por preco (min_price, max_price)
- [ ] Adicionar ordenacao (sort=price_asc, sort=price_desc)
- [ ] Adicionar endpoint de detalhes do produto
- [ ] Adicionar endpoint de comparacao
