<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
Project:
- Next.js App Router
- TypeScript
- Tailwind
- Prisma
- Server Actions

Rules:
- Don't use any
- Prefer Server Components
- Don't add comments
- Follow existing architecture
- Don't change the database schema from this project: don't edit `prisma/schema.prisma` manually, create or modify migrations, run Prisma migrations, or use `prisma db push`. Database schema changes are made in the main BlackBerry Shop project and synchronized here only with `prisma db pull`.
