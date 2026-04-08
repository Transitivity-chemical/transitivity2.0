# Documento de custos para publicar o Transitivity 2.0

**Data:** 2026-04-08  
**Escopo:** aplicacao web em `transitivity2.0` + API computacional em `Transitivity-back`  
**Moeda de referencia:** USD, com conversao aproximada de **USD 1 = R$ 5,17**. A cotacao deve ser revisada no dia da contratacao.

## 1. Resumo executivo

O Transitivity 2.0 nao e apenas uma landing page. O projeto atual usa:

- **Next.js 16 + React 19** para a interface e rotas API (`transitivity2.0`).
- **PostgreSQL + Prisma** para usuarios, projetos, reacoes, jobs, uploads, historico de chat e auditoria.
- **NextAuth/Auth.js** para autenticacao.
- **FastAPI + SciPy/cclib** para calculos de constante de velocidade, fitting, parsing de arquivos e geracao de inputs de dinamica molecular (`Transitivity-back`).
- **OpenRouter** para o assistente de IA, quando `OPENROUTER_API_KEY` estiver configurada.
- **Armazenamento persistente de arquivos** para substituir o uso atual de `/tmp/transitivity-uploads`, que nao e confiavel em ambiente serverless.
- **RabbitMQ/worker**, apenas se os jobs assincronos com `use_queue=true` forem habilitados em producao.

Minha recomendacao para colocar no ar com baixo risco e custo controlado:

1. **Frontend e rotas Next.js:** Vercel Pro.
2. **Banco:** Neon Launch ou equivalente PostgreSQL gerenciado.
3. **FastAPI:** Fly.io em Sao Paulo, com 2 GB para MVP e 4 GB se os calculos ficarem pesados.
4. **Uploads:** Vercel Blob ou S3 compativel.
5. **IA:** OpenRouter com limite mensal por chave.
6. **Fila:** adiar RabbitMQ ate haver necessidade real de processamento assincorno.

## 2. Premissas de estimativa

- Estimativa para um MVP academico/validacao inicial, nao para escala institucional completa.
- Trafego inicial baixo a moderado: dezenas de usuarios ativos, poucos calculos simultaneos.
- Sem GPU, sem execucao de Gaussian/CPMD/MLAtom no servidor; o backend atual gera/parseia dados e executa calculos Python com CPU.
- Banco inicial menor que 1 GB e uploads menores que 5 GB no primeiro ciclo.
- Custos de dominio, impostos, IOF e variacao cambial devem ser fechados no momento da compra.
- Valores de servicos em USD foram verificados em paginas publicas de precos em 2026-04-08.

## 3. Cenarios mensais

### Cenario A - Homologacao barata

Bom para demonstracao interna e validacao com poucos usuarios. Nao e ideal para producao publica.

| Item | Servico sugerido | Custo mensal |
| --- | --- | ---: |
| Web Next.js | Vercel Hobby | USD 0 |
| PostgreSQL | Neon Free | USD 0 |
| FastAPI | Fly.io `shared-cpu-2x`, 2 GB, Sao Paulo | USD 18,40 |
| Uploads | Vercel Blob dentro da franquia inicial | USD 0 |
| IA | OpenRouter com teto de credito | USD 10,00 |
| Dominio | `.br` ou equivalente | cerca de R$ 40 a R$ 90/ano |

**Total estimado:** **USD 28,40/mes**, aproximadamente **R$ 147/mes**, mais dominio.  
Se a API institucional `http://pitomba.ueg.br` continuar sendo usada sem custo, o total cai para cerca de **USD 10/mes** para o teto da IA.

Observacao: Vercel Hobby pode ser insuficiente se houver uso comercial, time, necessidade de logs/limites maiores ou cobranca de consumo adicional.

### Cenario B - Producao inicial recomendada

Bom para publicar com dominio proprio, colaboracao, banco gerenciado e custo previsivel.

| Item | Servico sugerido | Custo mensal |
| --- | --- | ---: |
| Web Next.js | Vercel Pro, 1 assento | USD 20,00 |
| PostgreSQL | Neon Launch, carga intermitente e ~1 GB | USD 15,00 estimado |
| FastAPI | Fly.io `shared-cpu-2x`, 2 GB, Sao Paulo | USD 18,40 |
| Uploads | Vercel Blob, baixo volume | USD 0 a USD 5 |
| IA | OpenRouter com limite de producao inicial | USD 20,00 |
| Monitoramento | Uptime/Sentry em plano gratuito | USD 0 |

**Total estimado:** **USD 73,40 a USD 78,40/mes**, aproximadamente **R$ 379 a R$ 405/mes**.

Se o backend precisar de 4 GB em Sao Paulo, trocar para `shared-cpu-2x`, 4 GB eleva o item FastAPI para **USD 34,56/mes**. Nesse caso, o total vai para aproximadamente **USD 89,56 a USD 94,56/mes** (**R$ 463 a R$ 489/mes**).

### Cenario C - Producao com fila e worker

Bom quando houver jobs demorados, varias execucoes simultaneas ou necessidade de nao bloquear a API.

| Item | Servico sugerido | Custo mensal |
| --- | --- | ---: |
| Web Next.js | Vercel Pro, 1 assento | USD 20,00 |
| PostgreSQL | Neon Launch, carga intermitente e ~1 GB | USD 15,00 estimado |
| FastAPI | Fly.io `shared-cpu-2x`, 2 GB, Sao Paulo | USD 18,40 |
| Worker Python | Fly.io `shared-cpu-2x`, 2 GB, Sao Paulo | USD 18,40 |
| RabbitMQ | Fly.io `shared-cpu-2x`, 1 GB, Sao Paulo, ou servico gerenciado equivalente | USD 10,32 |
| Volumes persistentes | 5 GB para broker/estado operacional | USD 0,75 |
| Uploads | Vercel Blob, baixo volume | USD 0 a USD 5 |
| IA | OpenRouter com limite maior | USD 50,00 |

**Total estimado:** **USD 132,87 a USD 137,87/mes**, aproximadamente **R$ 687 a R$ 713/mes**.

Se API e worker precisarem de 4 GB cada, o total sobe para cerca de **USD 165,19 a USD 170,19/mes** (**R$ 854 a R$ 880/mes**).

## 4. Custos variaveis importantes

### OpenRouter

O chat usa `OPENROUTER_API_KEY` e chama `https://openrouter.ai/api/v1`. O custo varia por modelo e por tokens. Para controlar gasto:

- Criar uma chave separada para producao.
- Definir limite mensal da chave.
- Comecar com teto de **USD 10 a USD 20/mes** no MVP.
- Em producao, revisar o teto apos 30 dias de uso real.

Formula pratica:

```text
custo do request = (tokens de entrada / 1.000.000 * preco_input)
                 + (tokens de saida / 1.000.000 * preco_output)
                 + taxa/credito OpenRouter aplicavel
```

### Banco de dados

O schema Prisma usa bastante tabela relacional, mas o volume inicial deve ser pequeno. O custo cresce com:

- quantidade de usuarios e equipes;
- historico de jobs e conversas;
- tamanho de JSONs de resultados;
- periodo de retencao/restore;
- uso de branches/previews se habilitados.

### Uploads

Hoje existe armazenamento em `/tmp/transitivity-uploads`. Em serverless isso deve ser tratado como temporario. Para producao, usar Vercel Blob, S3, Tigris ou Supabase Storage. O custo tende a ser baixo no comeco, mas arquivos `.log` grandes podem aumentar armazenamento e transferencia.

### FastAPI

O backend Python tem dependencias numericas (`numpy`, `scipy`, `cclib`) e deve rodar melhor em container dedicado do que em function serverless. Comecar com 2 GB e medir CPU/memoria. Subir para 4 GB se parsing/calc der timeout ou OOM.

## 5. Custos pontuais de implantacao

Estimativa de trabalho tecnico para colocar no ar com qualidade minima:

| Atividade | Esforco estimado |
| --- | ---: |
| Configurar Vercel, variaveis e build com Prisma | 2 a 4 h |
| Provisionar Postgres, rodar migrations e seed | 2 a 3 h |
| Deployar FastAPI em container e configurar `FASTAPI_URL` | 3 a 6 h |
| Trocar upload temporario por storage persistente | 4 a 8 h |
| Configurar dominio, HTTPS e redirects | 1 a 2 h |
| Ajustar seguranca de producao, CORS, secrets e backups | 3 a 6 h |
| Smoke test e checklist de go-live | 2 a 4 h |

**Total tecnico:** cerca de **17 a 33 horas**, dependendo de ja existir conta, dominio, API institucional e decisao sobre storage.

## 6. Checklist antes de ir para producao

- Gerar `AUTH_SECRET` novo e forte para producao.
- Definir `DATABASE_URL` e `DIRECT_URL` do banco gerenciado.
- Definir `FASTAPI_URL` sem depender do fallback hardcoded `http://pitomba.ueg.br`.
- Ajustar a pagina de status, que hoje usa `http://pitomba.ueg.br/theories` diretamente.
- Substituir `/tmp/transitivity-uploads` por storage persistente se os arquivos precisam sobreviver a redeploys.
- Restringir CORS no FastAPI; hoje o backend aceita `allow_origins=["*"]`.
- Definir limites de payload/upload para evitar custo inesperado.
- Criar backup/restore do banco.
- Configurar alertas de gasto em Vercel, Neon/Fly e OpenRouter.
- Rotacionar qualquer chave real que tenha sido registrada em documento, commit ou `.env` local.

## 7. Recomendacao final

Se a decisao for contratar infraestrutura externa para tudo, eu escolheria o **Cenario B**. Se a UEG puder hospedar API, banco e fila com backup/monitoramento, a recomendacao mais economica passa a ser a **Opcao 1** da secao 8.

- Vercel Pro para o app Next.js.
- Neon Launch ou equivalente para Postgres.
- Fly.io em Sao Paulo com `shared-cpu-2x`, 2 GB para o FastAPI.
- Vercel Blob para uploads.
- OpenRouter com teto inicial de USD 20/mes.
- Sem RabbitMQ no primeiro deploy, a menos que os jobs assincronos sejam requisito do lancamento.

Orcamento mensal esperado: **USD 73 a USD 95/mes**, aproximadamente **R$ 380 a R$ 490/mes**, antes de impostos, IOF e dominio.

## 8. Opcoes para API Python, banco e fila

Como a ideia agora e manter API Python, banco e fila fora da Vercel, existem algumas arquiteturas possiveis. Para o Transitivity, a escolha mais importante nao e so preco: e quem vai cuidar de backup, restore, atualizacao de seguranca, monitoramento, disco cheio e reinicio automatico.

### Matriz comparativa

| Opcao | Como ficaria | Custo mensal aproximado | Pontos fortes | Riscos/observacoes |
| --- | --- | ---: | --- | --- |
| Servidor UEG | FastAPI + Postgres + RabbitMQ no servidor institucional | USD 0 de cloud externa | Menor custo, controle local, boa integracao institucional | Depende de backup, HTTPS, monitoramento, firewall, acesso admin e SLA interno |
| VPS unico | Docker Compose com FastAPI + Postgres + RabbitMQ no mesmo VPS | USD 12 a USD 24 | Simples e barato; bom plano B se UEG nao puder hospedar | Ponto unico de falha; banco e fila competem por CPU/RAM; backup e patches por conta propria |
| AWS Lightsail | Instancia Linux para API/fila + banco Lightsail gerenciado | USD 27 a USD 39 | Preco previsivel; banco gerenciado a partir de USD 15 | RabbitMQ ainda fica autogerenciado; regiao geralmente fora do Brasil; Amazon MQ seria mais caro |
| DigitalOcean | Droplet para API/fila + PostgreSQL gerenciado | USD 39 a USD 58 | Painel simples; Postgres gerenciado; upgrade facil | RabbitMQ gerenciado nao e nativo; usar CloudAMQP ou autogerenciar no Droplet |
| Render | Web Service + Background Worker + Postgres + CloudAMQP | USD 63 a USD 107 | Deploy simples, logs, autoscaling e servicos separados | RabbitMQ nao e nativo; se usar Render Key Value no lugar da fila, precisa alterar codigo |
| Railway | API + Postgres + RabbitMQ/servico equivalente por uso | USD 20 a USD 60+ | Muito rapido para prototipo; bom DX | Conta por RAM/CPU/minuto; custo pode variar; precisa validar RabbitMQ no template/plugin atual |
| Fly.io | API e worker em Machines + RabbitMQ autogerenciado + Postgres separado | USD 47 a USD 95 | Boa opcao para container Python; tem regiao Sao Paulo | Postgres gerenciado no Fly pode complicar; RabbitMQ precisa operacao propria |
| Cloud classica | AWS ECS/EC2 + RDS + Amazon MQ, ou GCP Cloud Run + Cloud SQL + Pub/Sub | USD 100+ com facilidade | Mais robusto e corporativo | Excesso de complexidade para MVP; Pub/Sub/SQS nao e RabbitMQ sem adaptacao |

### Opcao 1 - UEG como infraestrutura principal

Essa e a melhor opcao de custo para agora, se houver condicoes operacionais. A Vercel ficaria com o Next.js e chamaria o backend por `FASTAPI_URL`, enquanto a UEG hospedaria:

- FastAPI em `uvicorn`/Docker, idealmente atras de Nginx ou Caddy com HTTPS.
- PostgreSQL com backup diario e retencao definida.
- RabbitMQ privado, sem porta publica para a internet.
- Worker Python como `systemd` service ou container separado.

Custo direto de cloud: **USD 0** para API, banco e fila.  
Custo real: tempo de administracao do servidor, risco de indisponibilidade e responsabilidade por backup.

Requisitos minimos para eu considerar aceitavel:

- subdominio fixo para API;
- HTTPS valido;
- firewall liberando publicamente so HTTP/HTTPS;
- Postgres e RabbitMQ acessiveis apenas localmente ou por rede privada/VPN;
- `systemd`, Docker Compose ou supervisor com restart automatico;
- backup automatico do Postgres fora da mesma maquina;
- alerta basico de disco, CPU, memoria e processo caido;
- teste de restore antes do go-live.

### Opcao 2 - VPS unico barato

Se a UEG nao puder manter tudo, um VPS unico roda o conjunto inteiro com Docker Compose. Exemplos de tamanho:

- **2 GB RAM / 2 vCPU:** suficiente para homologacao e poucos usuarios.
- **4 GB RAM / 2 vCPU:** recomendacao minima para producao pequena, porque Postgres, RabbitMQ, API e worker dividem memoria.

Custos de referencia:

- AWS Lightsail Linux 2 GB com IPv4: **USD 12/mes**.
- AWS Lightsail Linux 4 GB com IPv4: **USD 24/mes**.
- DigitalOcean Basic Droplet 4 GB / 2 vCPU: **USD 24/mes**.

Essa opcao e barata, mas precisa de rotina de operacao. Eu so usaria se tambem configurar snapshot/backup, firewall e restauracao documentada.

### Opcao 3 - VPS para API/fila + banco gerenciado

Meio-termo interessante: a API e o RabbitMQ ficam em VPS, mas o Postgres fica gerenciado.

Exemplo AWS Lightsail:

- instancia 2 GB ou 4 GB para FastAPI + RabbitMQ: **USD 12 a USD 24/mes**;
- banco Lightsail gerenciado 1 GB: **USD 15/mes**.

Total aproximado: **USD 27 a USD 39/mes**.

Exemplo DigitalOcean:

- Droplet 4 GB / 2 vCPU: **USD 24/mes**;
- PostgreSQL gerenciado 1 GB: **USD 15,15/mes**;
- CloudAMQP Tough Tiger para RabbitMQ, se nao quiser autogerenciar no Droplet: **USD 19/mes**.

Total aproximado: **USD 39,15/mes** com RabbitMQ no Droplet, ou **USD 58,15/mes** com RabbitMQ gerenciado basico.

### Opcao 4 - Render

Render e bom quando a prioridade e reduzir DevOps. Um desenho compativel seria:

- Web Service Standard para FastAPI: **USD 25/mes**;
- Background Worker Standard: **USD 25/mes**, se usar worker separado;
- Render Postgres Basic 1 GB: **USD 19/mes**;
- CloudAMQP Tough Tiger para RabbitMQ: **USD 19/mes**.

Total aproximado: **USD 63/mes** sem worker separado, ou **USD 88/mes** com worker. Em workspace Professional, somar **USD 19/usuario/mes**.

Observacao importante: Render Key Value e Redis-compativel, nao RabbitMQ. Usar isso como fila exigiria mudar o codigo Python que hoje usa `pika`/AMQP.

### Opcao 5 - Railway

Railway pode ser uma opcao rapida para prototipo, porque cobra assinatura e uso de recursos. Os planos atuais indicam:

- Hobby: **USD 5/mes**, com USD 5 de uso incluido.
- Pro: **USD 20/mes**, com USD 20 de uso incluido.
- Uso adicional: RAM, CPU, egress e volume por consumo.

Para API + Postgres + fila sempre ligados, eu trataria como **USD 20 a USD 60+/mes** ate medir consumo real. E bom para experimentar, mas eu colocaria um alerta de gasto desde o primeiro dia.

### Opcao 6 - Fly.io

Fly.io continua sendo uma opcao boa para a API Python se a prioridade for container e regiao Sao Paulo. Um desenho possivel:

- API `shared-cpu-2x`, 2 GB em Sao Paulo: **USD 18,40/mes**.
- Worker igual: **USD 18,40/mes**.
- RabbitMQ pequeno autogerenciado, 1 GB: **USD 10,32/mes**.
- Volume pequeno: cerca de **USD 0,15/GB/mes**.
- Postgres: manter na UEG/Neon, ou autogerenciar sabendo que aumenta o trabalho operacional.

Total aproximado com Postgres fora do Fly: **USD 47 a USD 53/mes**. Com Postgres gerenciado externo, somar o custo do banco.

### Opcao 7 - Cloud classica

AWS ECS/EC2 + RDS + Amazon MQ, ou GCP Cloud Run + Cloud SQL + Pub/Sub, fazem sentido quando houver requisito institucional de cloud grande, IAM detalhado, auditoria e contratos. Para o MVP, eu nao priorizaria: normalmente fica mais caro e mais complexo. Alem disso, SQS/Pub/Sub nao sao RabbitMQ; usar esses servicos exigiria adaptar a camada de fila.

### Recomendacao atual para API/banco/fila

Ordem que eu seguiria agora:

1. **UEG:** melhor custo, desde que tenha backup, HTTPS, firewall e responsavel claro pela operacao.
2. **UEG + banco gerenciado externo:** bom se o banco for o item mais sensivel e voces quiserem backup/restore mais simples.
3. **VPS unico 4 GB:** plano B barato para sair do zero, mas com risco operacional.
4. **Render ou Fly.io:** melhor se a dor de manter servidor ficar maior que o custo mensal.
5. **Cloud classica:** guardar para fase institucional/escala.

## 9. Fontes consultadas

- Vercel Pricing: https://vercel.com/pricing
- Vercel Pro Plan: https://vercel.com/docs/plans/pro-plan
- Vercel Blob Pricing: https://vercel.com/docs/vercel-blob/usage-and-pricing
- Neon Pricing: https://neon.com/pricing
- Fly.io Resource Pricing: https://fly.io/docs/about/pricing/
- AWS Lightsail Pricing: https://aws.amazon.com/lightsail/pricing/
- DigitalOcean Droplet Pricing: https://www.digitalocean.com/pricing/droplets
- DigitalOcean Managed Database Pricing: https://www.digitalocean.com/pricing/managed-databases
- Render Pricing: https://render.com/pricing
- Railway Pricing: https://docs.railway.com/pricing/plans
- CloudAMQP Pricing: https://www.cloudamqp.com/plans.html
- OpenRouter Pricing: https://openrouter.ai/pricing
- OpenRouter Limits/Credits: https://openrouter.ai/docs/api/reference/limits
- Cotacao USD/BRL de referencia: https://wise.com/us/currency-converter/usd-to-brl-rate/history
