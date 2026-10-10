This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Lembretes pelo WhatsApp

Em Minha carteira, o ícone de WhatsApp ao lado do nome prepara uma mensagem individual com grupo, cota e vencimento editável. O próximo vencimento considera imóveis no dia 15 e veículos no dia 7, usando a data de São Paulo. A mensagem é revisada pelo consultor antes do envio e não altera pagamentos ou comissões.

O espaço Lembretes e anexos aceita até 5 imagens JPG, PNG, WebP ou PDFs, até 10 MB por arquivo e 25 MB no total. Os arquivos adicionados ficam no IndexedDB deste navegador. Não são enviados ao GitHub, ao Supabase ou a outros dispositivos. A arte inicial de 15/10 está incluída no projeto; selecione-a somente quando sua data estiver correta.

Em celulares compatíveis, Compartilhar mensagem e anexos abre a seleção de aplicativos. O consultor escolhe WhatsApp e o destinatário; a Web Share API não define o cliente automaticamente. Em outros navegadores, use Abrir conversa com mensagem, Baixar anexo e o clipe do WhatsApp. Se o aplicativo não mantiver a legenda, use Copiar mensagem. Nenhuma mensagem é enviada automaticamente.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
