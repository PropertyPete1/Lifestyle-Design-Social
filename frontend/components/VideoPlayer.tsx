type Props = {
  src: string
}

export default function VideoPlayer({ src }: Props) {
  return (
    <video controls className="w-full rounded">
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
} 