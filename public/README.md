# Conversor de Moedas

Um conversor de moedas interativo desenvolvido com React, TypeScript e Vite.

O projeto permite comparar moedas de 64 países, visualizar as bandeiras, consultar taxas atualizadas e acompanhar a variação histórica da conversão em um gráfico interativo.

## Demonstração

O conversor permite escolher a moeda de origem e de destino, informar um valor e visualizar a cotação calculada. O gráfico apresenta os períodos de 7 dias, 1 mês, 3 meses e 1 ano.

## Funcionalidades

- Conversão entre moedas de 64 países
- Taxas de câmbio atualizadas por API
- Gráfico histórico de taxa com períodos de 7 dias, 1 mês, 3 meses e 1 ano
- Tooltip no gráfico com data e valor exato da cotação
- Seletor de moeda personalizado com bandeiras e busca por país ou código
- Botão para inverter as moedas selecionadas
- Animação contínua com bandeiras dos países
- Interface responsiva para computador e celular
- Navegação por teclado e interações por toque
- Cache local das últimas taxas válidas para uma experiência mais estável

## Tecnologias utilizadas

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- CSS
- [Frankfurter API](https://frankfurter.dev/)

## Como executar localmente

### Pré-requisitos

- Node.js 18 ou superior
- npm

### Instalação

Clone o repositório:

```bash
git clone https://github.com/Asapx380/currency-converter.git
```

Entre na pasta do projeto:

```bash
cd currency-converter
```

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Abra a URL exibida pelo Vite no navegador. Normalmente:

```text
http://localhost:5173
```

## Gerar a versão de produção

```bash
npm run build
```

Os arquivos finais serão gerados na pasta `dist`.

## Publicação no Netlify

1. Envie este projeto para o GitHub.
2. No Netlify, escolha **Add new site** e depois **Import an existing project**.
3. Conecte sua conta do GitHub e selecione o repositório `currency-converter`.
4. Use estas configurações:

```text
Build command: npm run build
Publish directory: dist
```

5. Clique em **Deploy site**.

## Autor

Desenvolvido por [Asapx380](https://github.com/Asapx380).
