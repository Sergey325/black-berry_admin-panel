This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Database connections are configured in the ignored `.env` file:

```dotenv
DATABASE_URL_DEV="postgresql://..."
DATABASE_URL_PROD="postgresql://..."
```

Run `npm run dev` to use the development database, or `npm run dev:prod` to run the local application against production data. Server Actions write to the selected database. The selected target is printed at startup.

Use `npm run build:dev` / `npm run start:dev` or `npm run build:prod` / `npm run start:prod` for an explicit database target when building and serving. Use the same target for both commands.

Existing deployments using `npm run build` and `npm run start` continue to use `DATABASE_URL`. An explicit `DATABASE_TARGET=dev` or `DATABASE_TARGET=prod` selects the corresponding connection for both the application and Prisma CLI. A missing selected connection raises an error.

Run the development server:

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
