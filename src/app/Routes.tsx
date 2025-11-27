import Layout from './layout/Layout'
import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';

const App = () => {
  return (
    <>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<h1>about</h1>} />
            </Route>
        </Routes>
    </>
  )
}

export default App