import GenerateCartoonForm from './GenerateCartoonForm';
import PromptManager from './PromptManager';
import CartoonQueueStatus from './CartoonQueueStatus';

export default function CartoonGeneratorPanel() {
  return (
    <div className="space-y-6">
      <GenerateCartoonForm />
      <CartoonQueueStatus />
      <PromptManager />
    </div>
  );
} 