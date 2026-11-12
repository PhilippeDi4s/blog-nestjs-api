import { Post } from '../entities/post.entity';

export interface PostLogSnapshot {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  updatedAt: Date;
}

export function toPostLogSnapshot(post: Post): PostLogSnapshot {
  return {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImage: post.coverImage?.url ?? null,
    published: post.published,
    updatedAt: post.updatedAt,
  };
}
