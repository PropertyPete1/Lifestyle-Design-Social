import { getAnalyticsData } from '@/lib/dashboard/getAnalyticsData';
import { AnalyticsCards } from './AnalyticsCards';
import { ViewsOverTimeChart } from './ViewsOverTimeChart';
import { HashtagPerformanceChart } from './HashtagPerformanceChart';
import HashtagPerformanceList from '../../components/HashtagPerformanceList';

export default async function DashboardPage() {
  const {
    totalPosts,
    successfulPosts,
    failedPosts,
    viewsOverTime,
    hashtagStats,
  } = await getAnalyticsData();

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold text-white mb-6">📊 Analytics Dashboard</h2>
      <AnalyticsCards
        totalPosts={totalPosts}
        successfulPosts={successfulPosts}
        failedPosts={failedPosts}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ViewsOverTimeChart viewsOverTime={viewsOverTime} />
        <HashtagPerformanceChart hashtagStats={hashtagStats} />
      </div>
      <div className="mt-6">
        <HashtagPerformanceList />
      </div>
    </main>
  );
} 