import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SWEPage() {
  const router = useRouter();
  const { color } = router.query;

  // Default to black if no color is provided
  const backgroundColor = color || '#000000';

  return (
    <div 
      className="min-h-screen transition-colors duration-1000"
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl mx-auto p-8">
        <Link 
          href="/" 
          className="inline-block px-4 py-2 bg-black bg-opacity-90 rounded-lg shadow-md hover:bg-opacity-100 transition-all duration-200 mb-8 text-white border border-white border-opacity-20"
        >
          ← Back to Home
        </Link>
        
        <div className="bg-black bg-opacity-90 rounded-lg shadow-lg p-8 border border-white border-opacity-10">
          <h1 className="text-4xl font-bold mb-6 text-white">Software Engineering</h1>
          
          <p className="text-gray-300 mb-4">
            This is a placeholder page for Software Engineering. Here you can add specific content
            related to this topic, such as:
          </p>
          
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Software development projects and experiences</li>
            <li>Technical skills and expertise</li>
            <li>Programming languages and frameworks</li>
            <li>Development methodologies and practices</li>
            <li>Code samples and technical articles</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 