export default function DebugPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Debug Page</h1>
        <p className="text-lg text-gray-600 mb-8">
          If you can see this page, routing is working correctly.
        </p>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold">Timestamp</h2>
            <p>{new Date().toISOString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold">Environment</h2>
            <p>Production Deployment Test</p>
          </div>
        </div>
      </div>
    </div>
  )
}