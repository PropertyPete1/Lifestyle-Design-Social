type Props = {
  message: string;
};

export default function SuccessAlert({ message }: Props) {
  return (
    <div className="bg-green-600 text-white px-4 py-2 rounded mb-4">
      {message}
    </div>
  );
} 