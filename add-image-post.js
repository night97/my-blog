
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const post = {
    title: '在极简博客中插入图片',
    slug: 'how-to-insert-images-in-minimal-blog',
    excerpt: '演示如何在文章中插入图片，以及图片在极简博客中的渲染效果。',
    content: `# 在极简博客中插入图片

Minimal Blog 使用 Markdown 语法，插入图片非常简单。

## 基本语法

Markdown 插入图片的语法是：

\`\`\`markdown
![描述](图片链接)
\`\`\`

## 示例

下面是一张示例图片：

![Minimal Blog 首页预览](https://picsum.photos/id/180/800/400)

这是一张海边风景图，来自 picsum.photos 提供的占位图服务。

## 另一张小一点的图片

![山脉风景](https://picsum.photos/id/10/600/300)

## 样式说明

在 Minimal Blog 中，图片会：
- 自动适应容器宽度，不会超出内容区
- 自动添加圆角
- 保持原有的宽高比

## 小结

就是这么简单！你只需要找个图床上传图片，然后用 Markdown 语法插入即可。

开始用图片丰富你的文章吧！`,
    published: true,
  };

  const exists = await prisma.post.findUnique({ where: { slug: post.slug } });
  if (!exists) {
    await prisma.post.create({ data: post });
    console.log('✅ Created: ' + post.title);
  } else {
    console.log('⚠️  Already exists: ' + post.title);
  }

  console.log('\n🎉 Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
