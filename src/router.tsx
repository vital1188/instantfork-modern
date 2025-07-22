import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { RestaurantRegister } from './pages/RestaurantRegister';
import { RestaurantLogin } from './pages/RestaurantLogin';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/restaurant-dashboard',
    element: <RestaurantDashboard />,
  },
  {
    path: '/restaurant-register',
    element: <RestaurantRegister />,
  },
  {
    path: '/restaurant-login',
    element: <RestaurantLogin />,
  },
]);
