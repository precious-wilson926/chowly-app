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

      {/* Both views stay mounted always — we only hide the inactive one.
          This is what stops React from wiping out an order's state
          when you switch tabs. */}
      <div style={{ display: role === 'customer' ? 'block' : 'none' }}>
        <CustomerView />
      </div>
      <div style={{ display: role === 'waiter' ? 'block' : 'none' }}>
        <WaiterView />
      </div>
    </div>
  )
}

export default App