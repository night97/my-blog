# My Blog - 极简博客系统

基于 Next.js 开发的轻量级个人博客系统，追求极简设计与完整功能的平衡。

## 🚀 技术框架

- **框架**: Next.js 14.1.0 (App Router)
- **数据库**: SQLite + Prisma ORM
- **样式**: TailwindCSS
- **语言**: TypeScript
- **表单**: React Hook Form + Zod 验证
- **加密**: bcryptjs 密码加密
- **Markdown**: React Markdown 渲染
- **其他**: date-fns, lucide-react, next-themes

## ✨ 功能特性

### 前台功能
- 📝 文章列表展示，支持分页（无限加载可扩展）
- 🔍 标题搜索功能
- 🏷️ 标签云筛选
- 📚 文集/专栏管理，支持有序阅读
- 📖 Markdown 渲染，支持目录生成
- 🧭 文章阅读进度条
- ⏱️ 预估阅读时间计算
- 🌓 明暗主题切换
- 📱 响应式设计，支持移动端
- 🔀 文章前后导航（按时间 / 按专栏）

### 后台功能
- 🔐 管理员登录认证
- ✍️ Markdown 编辑器实时预览
- 📝 文章支持发布/草稿状态
- 📦 文集管理，可调整文章排序
- 📤 支持批量上传 Markdown 文件
- 🎨 自定义文集封面

## 📁 项目结构

```
my-blog/
├── app/                    # Next.js App Router 路由
│   ├── (public)/          # 前台公开页面
│   │   ├── about/         # 关于页面
│   │   ├── collections/   # 文集列表
│   │   ├── collection/[slug] # 文集详情
│   │   ├── post/[slug]    # 文章详情
│   │   └── page.tsx       # 首页
│   ├── admin/             # 后台管理页面
│   │   ├── login/         # 登录页
│   │   ├── dashboard/     # 仪表盘
│   │   ├── post/          # 文章管理
│   │   └── collection/    # 文集管理
│   ├── layout.tsx         # 根布局
│   └── not-found.tsx      # 404 页面
├── components/            # React 组件
│   ├── editor/            # 编辑器相关
│   ├── layout/            # 布局组件
│   ├── ui/                # UI 基础组件
│   └── *.tsx              # 其他功能组件
├── lib/                   # 工具函数和库
│   ├── auth.ts            # 认证相关
│   ├── prisma.ts          # Prisma 客户端
│   ├── toc.ts             # 目录提取
│   └── utils.ts           # 工具函数
├── prisma/                # Prisma ORM
│   ├── schema.prisma      # 数据模型
│   └── dev.db             # SQLite 数据库
├── public/                # 静态资源
├── .env                   # 环境变量
├── Dockerfile             # Docker 构建文件
├── docker-compose.yml     # Docker Compose 配置
├── next.config.js         # Next.js 配置
├── tailwind.config.ts     # TailwindCSS 配置
└── tsconfig.json          # TypeScript 配置
```

## 🧬 数据模型

- **User**: 用户（管理员），包含用户名和密码哈希
- **Post**: 文章，支持标题、摘要、内容、发布状态
- **Collection**: 文集/合集，可归类文章
- **CollectionPost**: 文集-文章多对多关联，记录排序位置
- **Tag**: 标签，用于文章分类筛选

## 🛠️ 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件，检查数据库连接：

```
DATABASE_URL="file:./prisma/dev.db"
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 首次登录

默认管理员账号会自动创建：
- 用户名: `admin`
- 密码: `admin123`

> **安全提示**: 登录后请尽快修改默认密码。

## 📦 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 部署注意事项

- 项目使用 SQLite 数据库，适合个人小流量博客
- 部署时需要将 `prisma/dev.db` 一并部署（或保留写入权限）
- 支持部署到 Vercel、Netlify、Docker 等任何支持 Next.js 的平台

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down

# 停止并删除数据（注意：这会删除数据库！）
docker-compose down -v
```

服务启动后访问 http://localhost:3000

### 数据持久化

`docker-compose.yml` 中已经配置了数据卷，SQLite 数据库会保存在本地 `./prisma` 目录下，即使容器删除数据也会保留。

### 直接使用 Docker

```bash
# 构建镜像
docker build -t my-blog .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/prisma:/app/prisma \
  --name my-blog \
  --restart unless-stopped \
  my-blog
```

## ⚠️ 当前项目存在的问题

1. **数据库限制**: SQLite 适用于个人博客，不支持高并发和多人同时写入
2. **搜索能力**: 当前仅实现前端标题搜索，不支持全文搜索
3. **缺少图片上传**: 文章图片需要外部图床，没有内置上传功能
4. **无评论系统**: 需要自行集成 Disqus、Giscus 等第三方评论
5. **没有缓存策略**: 每次请求都查询数据库，高流量下需要增加缓存
6. **缺少 SEO 优化**: 未完整配置 sitemap、Open Graph 等
7. **没有备份功能**: 需要手动备份 SQLite 文件

## 🔮 未来规划

### 功能增强
- [ ] 支持评论功能（集成 Giscus / Disqus）
- [ ] 图片上传功能，支持本地存储或云存储
- [ ] 全文搜索（集成 Algolia 或 SQLite FTS）
- [ ] RSS 订阅输出
- [ ] Sitemap 自动生成
- [ ] 访问统计
- [ ] 文章备份导出（Markdown 批量导出）

### 技术优化
- [ ] 增加缓存层（Redis 或 Next.js Cache）
- [ ] 迁移到 PostgreSQL / MySQL 支持多人协作
- [ ] 图片懒加载
- [ ] 增量静态再生成（ISR）优化构建速度
- [ ] 添加单元测试

### 用户体验
- [ ] 文章阅读评论区
- [ ] 相关文章推荐
- [ ] 回到顶部按钮
- [ ] 自定义站点配置（标题、描述、LOGO 等）
- [ ] 代码高亮支持

## 📝 批量导入文章

项目提供了 `add-image-post.js` 脚本，可以批量处理本地 Markdown 文件导入：

```bash
node add-image-post.js
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
