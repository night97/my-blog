
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. 更新密码
  const passwordHash = await bcrypt.hash('zaq1@WSX!', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { passwordHash },
  });
  console.log('✅ Admin password updated to: zaq1@WSX!');

  // 2. 添加 3 篇示例文章
  const posts = [
    {
      title: '欢迎来到 Minimal Blog',
      slug: 'welcome-to-minimal-blog',
      excerpt: '这是一篇介绍极简博客设计理念的文章，聊聊我们对简洁写作的追求。',
      content: `# 欢迎来到 Minimal Blog

Minimal Blog 是一个极致简洁的博客系统，专注于内容本身，去掉了所有不必要的装饰。

## 设计理念

在信息爆炸的时代，我们更需要专注。极简设计的核心理念：

- **少即是多**：只保留必要的功能
- **内容优先**：让读者专注于阅读
- **快速响应**：无论在电脑还是手机上都有出色体验
- **Markdown 原生支持**：用最舒服的方式写作

## 主要特性

### 双端完美适配

- **桌面端**: 顶部导航 + 内容居中，舒适的行高和间距
- **移动端**: 底部标签栏，优化的单手操作体验

### 完整的管理后台

你现在看到的这篇文章就是通过管理后台创建的。管理后台支持：

- 文章的增删改查
- Markdown 编辑 + 实时预览
- 草稿/发布状态管理
- 自动生成文章链接别名（slug）

### 技术栈

- Next.js 14+ App Router
- TypeScript 类型安全
- Tailwind CSS 响应式设计
- SQLite + Prisma ORM
- React Markdown 渲染

开始你的创作之旅吧！`,
      published: true,
    },
    {
      title: '为什么我选择用 Markdown 写作',
      slug: 'why-i-write-with-markdown',
      excerpt: '聊聊 Markdown 的优势，为什么它成为了我写作的首选格式。',
      content: `# 为什么我选择用 Markdown 写作

作为一个开发者，我用过很多写作工具，最终还是回到了 Markdown。这其中有几个原因。

## 专注内容，而非格式

用 Word 或者富文本编辑器写作的时候，你总会忍不住纠结：

- 这个标题应该用几号字体？
- 这个列表缩进对不对？
- 这个段落要不要加个加粗效果？

而 Markdown 让你重新专注于**内容**，格式标记简单直观，写完之后自然渲染。

## 纯文本，永远可读

Markdown 就是纯文本，就算几百年后打开文件，你依然可以读懂内容，不会因为某个软件格式不兼容而打不开。

\`\`\`
# 这是标题
## 这是二级标题

这是**加粗**，这是*斜体*。

- 列表项 1
- 列表项 2
\`\`\`

## 无处不在

几乎所有现代平台都支持 Markdown：

- GitHub README
- 技术论坛
- 笔记软件（Notion、Obsidian、Bear...）
- 博客系统

学会一次，到处都能用。

## 结语

工具是为内容服务的，好的工具让你忘记工具的存在，专注于写作本身。Markdown 就是这样的工具。`,
      published: true,
    },
    {
      title: 'Next.js App Router 实践心得',
      slug: 'nextjs-app-router-practice',
      excerpt: '从 Pages Router 迁移到 App Router 后的一些实践心得和体会。',
      content: `# Next.js App Router 实践心得

最近用 Next.js 14 的 App Router 构建了这个博客项目，分享一些实践心得。

## 服务端组件 vs 客户端组件

这个项目充分利用了 App Router 的特性：

- **服务端组件**：首页、文章详情页直接在服务端查询数据库，不需要额外走 API，减少了一次网络往返
- **客户端组件**：表单、交互逻辑都放在客户端，保持代码清晰

刚开始分清楚什么时候用 'use client' 确实需要一点习惯，但理清之后代码结构比之前更清晰了。

## 路由分组

App Router 的路由分组功能（就是那个括号）很好用：

- (public) 放前台路由，共享前台布局（Header + MobileNav）
- admin 放后台路由，共享后台布局（AdminNav）
- 分组不影响最终 URL 结构

## 数据获取

服务端组件直接 async/await 拿数据，太舒服了：

\`\`\`tsx
export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
  })

  return <div>{/* 渲染 */}</div>
}
\`\`\`

不需要搞一堆 useEffect、loading state，代码简洁了很多。

## 认证

用 middleware 做路由保护也很简单，所有 /admin/* 路由在进入之前就检查 Cookie，未登录直接重定向，比之前自己在每个页面写检查逻辑干净多了。

## 总结

App Router 确实改变了一些过去的习惯，但适应之后，整体代码结构和数据流向都变得更清晰了。值得一试！`,
      published: true,
    },
  ];

  for (const post of posts) {
    // 检查是否已存在，避免重复创建
    const exists = await prisma.post.findUnique({ where: { slug: post.slug } });
    if (!exists) {
      await prisma.post.create({ data: post });
      console.log('✅ Created: ' + post.title);
    } else {
      console.log('⚠️  Already exists: ' + post.title);
    }
  }

  console.log('\n🎉 All done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
