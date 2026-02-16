# Sistema de Histórico de Preços e Trends

## Visão Geral

A página **Market Trends** (`/trends`) mostra as maiores variações de preço do mercado CS:GO, permitindo aos utilizadores identificar oportunidades de compra/venda.

## Como Funciona

### 1. Agregação de Preços Diários

O sistema agrega os preços dos listings da tabela `listings` e guarda médias diárias na tabela `price_history`:

- **avg_price**: Preço médio do dia
- **min_price**: Preço mínimo do dia
- **max_price**: Preço máximo do dia
- **listing_count**: Quantidade de listings
- **avg_float**: Float médio (opcional)

### 2. Criação da Tabela

Execute o SQL em `backend/src/db/price_history.sql` na base de dados:

```sql
-- Na sua base de dados PostgreSQL
\i backend/src/db/price_history.sql
```

Ou execute manualmente:

```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f backend/src/db/price_history.sql
```

### 3. Popular Dados Históricos (IMPORTANTE!)

Para a página funcionar, precisa de dados históricos. Pode:

#### Opção A: Agregação Manual (Teste Rápido)

Execute via API:

```bash
curl -X POST http://localhost:3001/api/trends/aggregate
```

Isto cria um snapshot dos preços atuais para hoje. **Repita isto alguns dias** para ter dados suficientes.

#### Opção B: Cronjob Automático (Produção)

Configure um cronjob para agregar preços diariamente às 00:00:

```bash
# Editar crontab
crontab -e

# Adicionar linha (agregação todos os dias à meia-noite)
0 0 * * * curl -X POST http://localhost:3001/api/trends/aggregate
```

#### Opção C: Dados de Teste (Desenvolvimento)

Para testes imediatos, pode inserir dados manualmente:

```sql
-- Inserir dados de teste para 7 dias atrás
INSERT INTO price_history (market_hash_name, date, avg_price, min_price, max_price, listing_count)
SELECT 
  market_hash_name,
  CURRENT_DATE - 7 as date,
  price * 0.8 as avg_price,  -- 20% mais barato há 7 dias
  price * 0.7 as min_price,
  price * 0.9 as max_price,
  1 as listing_count
FROM listings
WHERE market_hash_name IS NOT NULL
LIMIT 50;

-- Inserir dados de hoje
INSERT INTO price_history (market_hash_name, date, avg_price, min_price, max_price, listing_count)
SELECT 
  market_hash_name,
  CURRENT_DATE as date,
  price as avg_price,
  price * 0.9 as min_price,
  price * 1.1 as max_price,
  1 as listing_count
FROM listings
WHERE market_hash_name IS NOT NULL
LIMIT 50;
```

## Endpoints da API

### GET /api/trends/top-gainers
Retorna itens com maior aumento de preço.

**Query params:**
- `days` (default: 7) - Período de comparação
- `limit` (default: 20) - Número de resultados

### GET /api/trends/top-losers
Retorna itens com maior queda de preço.

**Query params:**
- `days` (default: 7) - Período de comparação
- `limit` (default: 20) - Número de resultados

### GET /api/trends/biggest-changes
Retorna as maiores variações (positivas e negativas).

**Query params:**
- `days` (default: 7) - Período de comparação
- `limit` (default: 40) - Número de resultados

### GET /api/trends/item/:marketHashName
Retorna histórico de preços de um item específico.

**Query params:**
- `days` (default: 30) - Número de dias de histórico

### POST /api/trends/aggregate
Agrega preços do dia atual (admin/cronjob).

## Features da Página

### Timeframes
- **24h**: Variações do último dia
- **7 dias**: Variações da última semana (padrão)
- **30 dias**: Variações do último mês

### Secções
- **Top Gainers** 🔥: Itens com maior valorização
- **Top Losers** 📉: Itens com maior desvalorização

### Informações Exibidas
- Nome do item (com link para página de detalhes)
- Imagem do item
- Preço atual vs anterior
- Variação percentual
- Variação absoluta em euros

## Troubleshooting

### "Sem dados suficientes para este período"

**Causa**: Não há dados históricos na tabela `price_history`.

**Solução**: 
1. Execute `POST /api/trends/aggregate` para criar snapshot de hoje
2. Insira dados de teste manualmente para dias anteriores (ver Opção C acima)
3. Configure cronjob para agregação automática

### Variações não fazem sentido

**Causa**: Dados inconsistentes ou poucos listings.

**Solução**:
- Certifique-se que a tabela `listings` tem dados suficientes
- Execute a agregação várias vezes ao longo de dias
- Considere filtrar itens com `listing_count` baixo

## Próximos Passos (Opcional)

- Adicionar gráficos de linha com histórico completo
- Implementar alertas de preço
- Adicionar filtros por categoria/raridade
- Exportar dados para CSV
