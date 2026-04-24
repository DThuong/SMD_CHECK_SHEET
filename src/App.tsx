import Routes from './app/Routes'
import { Toaster } from 'sonner'
import UpdateChecker from './components/general/UpdateChecker'

function App() {
  return (
    <>
      <UpdateChecker />
      <Toaster position="top-right" richColors />
      <Routes />
    </>
  )
}

export default App
