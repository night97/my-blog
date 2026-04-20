# 使用官方 Node.js 18 镜像作为基础（Debian 版本，解决 Prisma OpenSSL 依赖问题）
FROM node:18 AS base

# 安装依赖阶段
FROM base AS deps
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 环境变量
ENV DATABASE_URL="file:/app/prisma/dev.db"

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用（不执行 db push，数据库在运行时创建）
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV DATABASE_URL="file:/app/prisma/dev.db"

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules

# 创建空的数据库文件
RUN touch /app/prisma/dev.db && chmod 666 /app/prisma/dev.db

EXPOSE 3000

ENV PORT 3000

# 容器启动时初始化数据库
CMD ["sh", "-c", "npx prisma db push && node scripts/init-db.js && node server.js"]