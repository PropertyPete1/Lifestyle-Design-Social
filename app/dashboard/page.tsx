import YouTubeUploadForm from './components/YouTubeUploadForm';
import UploadForm from './components/UploadForm';
import LogTable from './components/LogTable';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center">📊 Dashboard</h1>
      <UploadForm />
      <YouTubeUploadForm />
      <LogTable />
    </div>
  );
} 