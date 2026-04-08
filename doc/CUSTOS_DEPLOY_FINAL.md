# Custo final de publicacao do Transitivity 2.0

**Data:** 2026-04-08  
**Dominio:** `transitivity.com.br`  
**Escopo:** frontend Next.js, backend Python, banco de dados, fila, e-mail transacional e LLM.  
**Cotacao de referencia:** USD 1 = R$ 5,17. Revisar a cotacao no dia do pagamento.

## 1. Infraestrutura definida

| Item | Servico definido | Custo |
| --- | --- | ---: |
| Dominio | `transitivity.com.br` | R$ 40/ano |
| E-mail transacional | Resend, plano gratuito ate 3.000 e-mails/mes | R$ 0 |
| LLM | OpenRouter | USD 20/mes |
| Frontend Next.js | Vercel Pro | USD 20/mes |
| Backend | DigitalOcean para API Python, banco de dados e fila | USD 60/mes |

## 2. Total mensal

| Categoria | Custo mensal |
| --- | ---: |
| OpenRouter | USD 20 |
| Vercel Pro | USD 20 |
| DigitalOcean | USD 60 |
| Resend | USD 0 |
| Dominio, rateado mensalmente | R$ 3,33 |

**Total mensal em USD:** **USD 100/mes**  
**Total mensal convertido:** **R$ 517/mes**  
**Total mensal com dominio rateado:** **R$ 520,33/mes**

## 3. Total anual

| Categoria | Custo anual |
| --- | ---: |
| OpenRouter | USD 240 |
| Vercel Pro | USD 240 |
| DigitalOcean | USD 720 |
| Resend | USD 0 |
| Dominio `transitivity.com.br` | R$ 40 |

**Total anual em USD:** **USD 1.200/ano**  
**Total anual convertido:** **R$ 6.204/ano**  
**Total anual com dominio:** **R$ 6.244/ano**

## 4. O que fica em cada servico

### Vercel

- Hospedagem do frontend Next.js.
- Deploys automatizados.
- Variaveis de ambiente do frontend e rotas Next.js.
- Configuracao de dominio apontando para `transitivity.com.br`.

### DigitalOcean

- API Python/FastAPI.
- Banco de dados PostgreSQL.
- Fila RabbitMQ e worker Python, se a fila for usada em producao.
- Rotinas de backup, logs e monitoramento do backend.

### OpenRouter

- Assistente LLM do Transitivity.
- Teto operacional inicial: **USD 20/mes**.
- O custo pode subir se o volume de tokens ou o modelo selecionado aumentar.

### Resend

- Envio de e-mails transacionais.
- Plano gratuito enquanto o uso ficar em ate **3.000 e-mails/mes**.
- Se o uso passar desse limite, sera necessario revisar o custo.

## 5. Observacoes

- Impostos, IOF, variacao cambial e eventuais taxas do cartao nao estao incluidos.
- O valor da DigitalOcean foi tratado como pacote fechado de **USD 60/mes** para backend, banco e fila.
- O dominio e anual; no resumo mensal ele aparece apenas como rateio para facilitar comparacao.
- Antes do go-live, configurar `AUTH_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `FASTAPI_URL`, `OPENROUTER_API_KEY` e variaveis do Resend.
- O backend deve ter HTTPS, backup do banco, restart automatico e monitoramento basico antes de ser considerado producao.
