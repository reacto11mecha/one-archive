# ==========================================
# STAGE 1: Dependencies Dasar
# ==========================================
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ==========================================
# STAGE 2: Install Depedencies
# ==========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ==========================================
# STAGE 3: Build Aplikasi
# ==========================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Bypass validasi env saat proses build berlangsung
ENV SKIP_ENV_VALIDATION="1"
ENV NEXT_TELEMETRY_DISABLED="1"

RUN pnpm run build

# ==========================================
# STAGE 4: Production Runner
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy aset publik
COPY --from=builder /app/public ./public

# Setup direktori dengan permissions yang benar
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy output standalone hasil kompresi Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
