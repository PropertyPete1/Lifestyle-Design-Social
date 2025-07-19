type Props = {
  message: string;
};

export default function ErrorAlert({ message }: Props) {
  return (
    <div className="bg-red-600 text-white px-4 py-2 rounded mb-4">
      {message}
    </div>
  );
} 