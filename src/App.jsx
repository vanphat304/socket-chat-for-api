import './App.css'
import ChatTest from './ChatTest'
import Login from './Login'
import { useAuth } from './AuthContext'

function App() {
  const { user } = useAuth();

  return (
    <>
      {user ? <ChatTest /> : <Login />}
    </>
  )
}

export default App
