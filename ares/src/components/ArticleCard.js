'use client';

import React from 'react';

class ArticleCardErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ArticleCard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-100">
          <h3 className="font-bold mb-1">Article Loading Error</h3>
          <p className="text-sm">Unable to display article. Please try refreshing.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function ArticleCard({ article }) {
  if (!article) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
        <p className="text-gray-400">No article data available</p>
      </div>
    );
  }

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Unknown date';

  return (
    <ArticleCardErrorBoundary>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
        <h2 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2">{article.title}</h2>
        <p className="text-gray-300 italic mb-3">by {article.author}</p>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-gray-700/50 text-gray-200 text-xs px-3 py-1 rounded-full border border-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-gray-400 text-sm mb-4">Published: {publishedDate}</p>

        {article.summary && (
          <p className="text-gray-300 text-sm line-clamp-3 mb-4">{article.summary}</p>
        )}

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors">
          Read More
        </button>
      </div>
    </ArticleCardErrorBoundary>
  );
}

export default ArticleCard;
