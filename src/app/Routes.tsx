import Layout from './layout/Layout'
import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import ErrorPage from '../pages/ErrorPage';

const App = () => {
  return (
    <>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path='*' element={<ErrorPage/>}/>
            </Route>
        </Routes>
    </>
  )
}

export default App