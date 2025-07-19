type Props = {
  src: string;
};

export default function VideoPreview({ src }: Props) {
  return (
    <video
      src={src}
      controls
      muted
      autoPlay
      className="rounded-md shadow-md max-w-full h-auto"
    />
  );
} 