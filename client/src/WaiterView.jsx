import { useState, useEffect } from 'react'

function WaiterView() {
  const [orders, setOrders] = useState([])
  const [staff, setStaff] = useState([])
  const [openOrderId, setOpenOrderId] = useState(null)
  const [waiterId, setWaiterId] = useState('')
  const [chefId, setChefId] = useState('')
  const [bartenderId, setBartenderId] = useState('')

  useEffect(() => {
    loadOrders()
    fetch('/api/staff').then(res => res.json()).then(setStaff)
    // poll for new orders every 4 seconds
    const interval = setInterval(loadOrders, 4000)
    return () => clearInterval(interval)
  }, [])

  function loadOrders() {
    fetch('/api/orders').then(res => res.json()).then(setOrders)
  }

  async function assign(orderId) {
    await fetch('/api/orders/' + orderId + '/assign', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waiter_id: waiterId || null,
        chef_id: chefId || null,
        bartender_id: bartenderId || null
      })
    })
    setOpenOrderId(null)
    setWaiterId(''); setChefId(''); setBartenderId('')
    loadOrders()
  }

  const chefs = staff.filter(s => s.role === 'chef')
  const bartenders = staff.filter(s => s.role === 'bartender')
  const waiters = staff.filter(s => s.role === 'waiter')

  const newOrders = orders.filter(o => o.status === 'placed')
  const inProgress = orders.filter(o => o.status !== 'placed')

  return (
    <div>
      <h2>New Orders</h2>
      {newOrders.length === 0 && <p className="empty-note">Nothing waiting right now.</p>}
      {newOrders.map(order => (
        <div className="order-card" key={order.id}>
          <p><strong>Order #{order.id}</strong> — {order.table_number}</p>

          {openOrderId === order.id ? (
            <div className="assign-form">
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
              <button
                className="primary"
                onClick={() => assign(order.id)}
                disabled={!waiterId || !chefId || !bartenderId}
              >
                Mark Served
              </button>
            </div>
          ) : (
            <button onClick={() => setOpenOrderId(order.id)}>Open</button>
          )}
        </div>
      ))}

      <h2>Served / Paid</h2>
      {inProgress.length === 0 && <p className="empty-note">No orders yet.</p>}
      {inProgress.map(order => (
        <div className="order-card muted" key={order.id}>
          <p><strong>Order #{order.id}</strong> — {order.table_number} — {order.status}</p>
        </div>
      ))}
    </div>
  )
}

export default WaiterView