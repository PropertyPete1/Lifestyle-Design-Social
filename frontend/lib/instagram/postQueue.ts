import { InstagramPostPayload } from './types';

export async function runQueue(posts: InstagramPostPayload[]) {
  for (const post of posts) {
    console.log('Publishing scheduled post:', post.caption);
  }
} 