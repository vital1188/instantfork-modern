import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { RestaurantRegister } from './pages/RestaurantRegister';
import { RestaurantLogin } from './pages/RestaurantLogin';

// Error boundary component for route errors
function ErrorBoundary() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We're sorry, but something unexpected happened.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

// 404 Not Found component
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          404
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Page not found
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/restaurant-dashboard',
    element: <RestaurantDashboard />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/restaurant-register',
    element: <RestaurantRegister />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/restaurant-login',
    element: <RestaurantLogin />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
