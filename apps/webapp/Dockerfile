# ---------------------------------
# BASE STAGE
# ---------------------------------
FROM node:lts-alpine AS base

RUN apk update && apk add --no-cache libc6-compat

RUN corepack enable pnpm
RUN corepack prepare --activate pnpm@10.25.0
# ---------------------------------

# ---------------------------------
# PRUNE STAGE
# ---------------------------------
FROM base AS pruner

RUN apk update

WORKDIR /app

COPY . ./

RUN pnpm dlx turbo prune webapp --docker
# ---------------------------------

# ---------------------------------
# BUILD STAGE
# ---------------------------------
FROM base AS builder

RUN apk update

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# Navigate to the webapp project
WORKDIR /app/apps/webapp

# Run the prisma generate command from there to generate the prisma client
RUN pnpm run prisma:generate:docker
# Then navigate back to the root of the project to continue with the rest of the build
WORKDIR /app

RUN pnpm dlx turbo run build --filter=webapp...
# ---------------------------------

# ---------------------------------
# RUNNER STAGE
# ---------------------------------
FROM builder AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/webapp/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/webapp/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/webapp/.next/static ./.next/static

USER nextjs

ENV PORT=3000

EXPOSE ${PORT}

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/webapp/server.js"]
# ---------------------------------
