export type InstagramPostPayload = {
  videoUrl: string
  caption: string
  accessToken: string
  userId: string
}

export interface InstagramMediaItem {
  id: string
  caption?: string
  media_type: string
  media_url: string
  timestamp: string
} 