# Webapp

This is a [Next.js](https://nextjs.org) project.

---

### Development

Make a copy of the `.env.example` file, rename it to `.env` and supply the values for it.

After you've got your `.env` file, follow the next steps:

```bash
# Deploy database migrations. You will need to run this if you just spun up the docker compose stack.
$ pnpm prisma:push

# Run this if you want to create database migrations after making changes the prisma schema. You will be prompted to provide a name for the migration.
$ pnpm prisma:migrate

# Start the dev server
$ pnpm dev
```

Your application will be available at `http://localhost:3000`.

---

### Building

Create a production build:

```bash
pnpm build
```

---

### Deployment

### Docker Deployment

To build and run using Docker:

```bash
$ docker build . \
  -t localmailer-webapp \
  # provide all the ENV variables which are prefixed with "NEXT_PUBLIC" as these variables need to be injected during build time. You can get them from the .env file.
  --build-arg KEY=VALUE

$ docker run -itd \
  -p 3000:3000 \
  # provide all the ENV variables which are not prefixed with "NEXT_PUBLIC" as these variables are dynamic and can be injected at runtime. You can get them from the .env file.
  -e KEY=VALUE \
  localmailer-webapp
```

---
