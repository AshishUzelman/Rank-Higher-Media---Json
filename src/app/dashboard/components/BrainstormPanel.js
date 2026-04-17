'use client';

export default function BrainstormPanel({ brainstorms }) {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Brainstorm History</h2>
      </div>
      <div className="divide-y divide-gray-700">
        {brainstorms.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No brainstorm history
          </div>
        ) : (
          brainstorms.map(brainstorm => (
            <div key={brainstorm.id} className="p-4 hover:bg-gray-700 transition-colors">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white">{brainstorm.topic}</h3>
                <span className="text-xs text-gray-400">
                  {new Date(brainstorm.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-300 text-sm mt-2">{brainstorm.summary}</p>
              <div className="mt-2 flex space-x-2">
                {brainstorm.participants.map(participant => (
                  <span key={participant} className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {participant}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
