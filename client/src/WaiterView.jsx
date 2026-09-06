import { useState, useEffect } from 'react'

function WaiterView() {
  const [orders, setOrders] = useState([])
  const [staff, setStaff] = useState([])
  const [openOrderId, setOpenOrderId] = useState(null)
  const [chefId, setChefId] = useState('')
  const [bartenderId, setBartenderId] = useState('')
  const [waiterId, setWaiterId] = useState('')

  useEffect(() => {
    loadOrders()
    fetch('/api/staff').then(res => res.json()).then(setStaff)
  }, [])

  function loadOrders() {
    fetch('/api/orders').then(res => res.json()).then(setOrders)
  }

  async function assign(orderId) {
    await fetch('/api/orders/' + orderId + '/assign', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waiter_id: waiterId, chef_id: chefId, bartender_id: bartenderId })
    })
    setOpenOrderId(null)
    loadOrders()
  }

  const chefs = staff.filter(s => s.role === 'chef')
  const bartenders = staff.filter(s => s.role === 'bartender')
  const waiters = staff.filter(s => s.role === 'waiter')

  return (
    <div>
      <h2>Orders</h2>
      {orders.map(order => (
        <div key={order.id}>
          <p>Order #{order.id} — {order.status} — {order.table_number}</p>
          {order.status === 'placed' && (
            openOrderId === order.id ? (
              <div>
                <select value={waiterId} onChange={e => setWaiterId(e.target.value)}>
                  <option value="">Waiter...</option>
                  {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <select value={chefId} onChange={e => setChefId(e.target.value)}>
                  <option value="">Chef...</option>
                  {chefs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={bartenderId} onChange={e => setBartenderId(e.target.value)}>
                  <option value="">Bartender...</option>
                  {bartenders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button onClick={() => assign(order.id)}>Mark Served</button>
              </div>
            ) : (
              <button onClick={() => setOpenOrderId(order.id)}>Open</button>
            )
          )}
        </div>
      ))}
    </div>
  )
}

export default WaiterView