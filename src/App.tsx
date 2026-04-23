import Routes from './app/Routes'
import { Toaster } from 'sonner'
function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes />
    </>
  )
}

export default App
