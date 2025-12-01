
import { Outlet } from "react-router-dom"
import Header from "../../components/general/Header"
import Footer from "../../components/general/Footer"
const UserLayout = () => {
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

export default UserLayout