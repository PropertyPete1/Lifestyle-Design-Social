type Props = {
  videoUrl: string
}

export default function VideoPreview({ videoUrl }: Props) {
  return (
    <video controls className="w-full rounded-lg shadow-md mt-4">
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
} 