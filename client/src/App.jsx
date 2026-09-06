import { useState } from 'react'
import CustomerView from './CustomerView'
import WaiterView from './WaiterView'
import './App.css'

function App() {
  const [role, setRole] = useState('customer')

  return (
    <div className="app">
      <div className="role-switch">
        <button onClick={() => setRole('customer')} disabled={role === 'customer'}>
          I'm a Customer
        </button>
        <button onClick={() => setRole('waiter')} disabled={role === 'waiter'}>
          I'm a Waiter
        </button>
      </div>

      {role === 'customer' ? <CustomerView /> : <WaiterView />}
    </div>
  )
}

export default App