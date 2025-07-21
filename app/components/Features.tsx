'use client';

export default function Features() {
  const features = [
    {
      title: "Automated Posting",
      description: "Schedule and automate your social media content across multiple platforms",
      icon: "🚀"
    },
    {
      title: "AI Content Generation",
      description: "Generate engaging captions and content using OpenAI integration",
      icon: "🤖"
    },
    {
      title: "Multi-Platform Support",
      description: "Post to Instagram, YouTube, and other social platforms seamlessly",
      icon: "📱"
    },
    {
      title: "Analytics Dashboard",
      description: "Track performance and engagement metrics in real-time",
      icon: "📊"
    }
  ];

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-yellow-400">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-gray-800 rounded-lg">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-yellow-300">
                {feature.title}
              </h3>
              <p className="text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 