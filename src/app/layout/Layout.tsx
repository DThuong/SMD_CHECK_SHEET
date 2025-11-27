
import { Outlet } from "react-router-dom"
import Header from "../../components/general/Header"
import Footer from "../../components/general/Footer"
const Layout = () => {
  return (
    <div>
      <Header />
        <main>
            <Outlet />
        </main>
      <Footer />
    </div>
  )
}

export default Layout