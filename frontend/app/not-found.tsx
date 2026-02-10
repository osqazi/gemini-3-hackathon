export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            404 - Page Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The page you are looking for does not exist.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Go back home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}