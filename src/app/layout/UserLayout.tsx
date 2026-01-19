
import { Outlet } from "react-router-dom"
import Header from "../../components/general/Header"
const UserLayout = () => {
  return (
    <div>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default UserLayout