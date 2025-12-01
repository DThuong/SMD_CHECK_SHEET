//layout
import UserLayout from './layout/UserLayout'
import AdminLayout from './layout/AdminLayout';
// router
import { Route, Routes } from 'react-router-dom';
// user pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import ErrorPage from '../pages/ErrorPage';
// admin pages
import Dashboard from '../pages/admin/Dashboard';
import Profile from '../pages/admin/Profile';
import User from '../pages/admin/User';
import Settings from '../pages/admin/Settings';
import Logs from '../pages/admin/Logs';

const App = () => {
  return (
    <>
        <Routes>
          {/** user routes */}
            <Route element={<UserLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path='*' element={<ErrorPage/>}/>
            </Route>
          
          {/** admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/user" element={<User />} />
            <Route path="/admin/logs" element={<Logs />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Routes>
    </>
  )
}

export default App