'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function SEOWidget() {
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seoRef = collection(db, 'seo_tool');
    const unsubscribe = onSnapshot(seoRef, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setSeoData(data);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 p-6">
        <p className="text-gray-400 text-center">Loading SEO metrics...</p>
      </div>
    );
  }

  if (!seoData) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 p-6">
        <p className="text-gray-400 text-center">No SEO data available</p>
      </div>
    );
  }

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '→';
  };

  const metrics = [
    {
      label: 'Keywords Tracked',
      value: seoData.keywordsTracked || 0,
      trend: seoData.keywordsTrend || 'neutral',
      icon: '🔑'
    },
    {
      label: 'Backlinks',
      value: seoData.backlinks || 0,
      trend: seoData.backlinksTrend || 'neutral',
      icon: '🔗'
    },
    {
      label: 'Organic Traffic',
      value: seoData.organicTraffic || 0,
      trend: seoData.trafficTrend || 'neutral',
      icon: '📊'
    },
    {
      label: 'Domain Authority',
      value: seoData.domainAuthority || 0,
      trend: seoData.authorityTrend || 'neutral',
      icon: '⭐'
    }
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">SEO Metrics</h2>
        {seoData.lastUpdated && (
          <p className="text-gray-400 text-sm mt-1">
            Last updated: {new Date(seoData.lastUpdated.seconds * 1000).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`text-lg ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
              </span>
            </div>
            <p className="text-gray-400 text-xs mb-1">{metric.label}</p>
            <p className="text-white text-2xl font-bold">{metric.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {seoData.topKeywords && seoData.topKeywords.length > 0 && (
        <div className="p-5 border-t border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">Top Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {seoData.topKeywords.slice(0, 10).map((keyword, idx) => (
              <span
                key={idx}
                className="bg-gray-700 text-gray-200 text-xs px-3 py-1 rounded-full border border-gray-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {seoData.insights && (
        <div className="p-5 border-t border-gray-700 bg-gray-700/50">
          <h3 className="text-sm font-bold text-white mb-2">Insights</h3>
          <p className="text-gray-300 text-sm">{seoData.insights}</p>
        </div>
      )}
    </div>
  );
}
