import EnterpriseFaceEngine from '../components/EnterpriseFaceEngine';

export function TestEnterpriseFace() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Enterprise Face Engine Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Face Detection & Capture System
          </h2>
          
          <div className="text-gray-600 mb-6">
            <p className="mb-2">📸 <strong>Features:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Real-time face detection using MediaPipe</li>
              <li>Automatic capture based on head position</li>
              <li>Environment quality checks (lighting, blur, glare)</li>
              <li>Unlimited retakes for each angle</li>
              <li>Supports Front, Left, and Right views</li>
            </ul>
          </div>
          
          <div className="border-t pt-6">
            <EnterpriseFaceEngine />
          </div>
        </div>
      </div>
    </div>
  );
};


