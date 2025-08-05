# Configuração de Webhook Local

Este guia explica como configurar o webhook para funcionar em localhost usando ngrok.

## Pré-requisitos

1. Conta no [ngrok](https://ngrok.com/) (gratuita)
2. Token de autenticação do ngrok (opcional, mas recomendado)

## Configuração

### 1. Configurar o ngrok (opcional)

Se você tem uma conta no ngrok, adicione seu token de autenticação:

```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

### 2. Iniciar o servidor de desenvolvimento

Em um terminal, inicie o servidor Next.js:

```bash
npm run dev
```

### 3. Iniciar o túnel ngrok

Em outro terminal, inicie o túnel ngrok:

```bash
npm run dev:tunnel
```

Ou usando o arquivo de configuração:

```bash
ngrok start pixoo
```

### 4. Configurar o webhook na API externa

O ngrok irá gerar uma URL pública (ex: `https://abc123.ngrok.io`). Use esta URL para configurar o webhook:

```
https://abc123.ngrok.io/api/webhook/bfl
```

## Testando

1. Acesse a aplicação em `http://localhost:3000`
2. Gere uma imagem
3. O webhook será enviado para a URL do ngrok, que redirecionará para seu localhost
4. Verifique os logs no terminal do servidor para confirmar que o webhook foi recebido

## Dicas

- **URLs dinâmicas**: A URL do ngrok muda a cada reinicialização (conta gratuita)
- **Subdomínio fixo**: Contas pagas permitem subdomínios personalizados
- **Logs**: Use `ngrok http 3000 --log=stdout` para ver logs detalhados
- **Interface web**: Acesse `http://localhost:4040` para ver a interface do ngrok

## Troubleshooting

### Erro de conexão
- Verifique se o servidor Next.js está rodando na porta 3000
- Confirme se o ngrok está apontando para a porta correta

### Webhook não recebido
- Verifique se a URL do webhook está correta na API externa
- Confirme se o endpoint `/api/webhook/bfl` está funcionando
- Verifique os logs do ngrok em `http://localhost:4040`

### Rate limiting
- Contas gratuitas do ngrok têm limitações de requisições
- Considere uma conta paga para uso intensivo