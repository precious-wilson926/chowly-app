import { useState, useEffect } from 'react'

function CustomerView() {
  const [menu, setMenu] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [cart, setCart] = useState({})
  const [order, setOrder] = useState(null)
  const [complaint, setComplaint] = useState('')
  const [rating, setRating] = useState(5)

  useEffect(() => {
    fetch('/api/menu').then(res => res.json()).then(setMenu)
  }, [])

  // auto-refresh the order status every 4s while it isn't paid yet
  useEffect(() => {
    if (!order || order.status === 'paid') return
    const interval = setInterval(async () => {
      const res = await fetch('/api/orders/' + order.id)
      setOrder(await res.json())
    }, 4000)
    return () => clearInterval(interval)
  }, [order])

  function changeQty(id, delta) {
    setCart(prev => {
      const next = { ...prev }
      const updated = Math.max(0, (next[id] || 0) + delta)
      if (updated === 0) delete next[id]
      else next[id] = updated
      return next
    })
  }

  const cartEntries = Object.entries(cart)
  const total = cartEntries.reduce((sum, [id, qty]) => {
    const item = menu.find(m => m.id === Number(id))
    return sum + (item ? item.price * qty : 0)
  }, 0)

  async function placeOrder() {
  const items = cartEntries.map(([menu_item_id, quantity]) => ({
    menu_item_id: Number(menu_item_id), quantity
  }))
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table_number: tableNumber || 'Unspecified', items })
  })
  const created = await res.json()

  const fullOrder = await fetch('/api/orders/' + created.id).then(r => r.json())
  setOrder(fullOrder)
}

  async function submitRating() {
    const res = await fetch('/api/orders/' + order.id + '/complaint', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    })
    setOrder(await res.json())
  }

  async function submitComplaint() {
    const res = await fetch('/api/orders/' + order.id + '/complaint', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_text: complaint })
    })
    setOrder(await res.json())
  }

  async function pay() {
    const res = await fetch('/api/orders/' + order.id + '/pay', { method: 'PATCH' })
    setOrder(await res.json())
  }

  function startNewOrder() {
    setOrder(null)
    setCart({})
    setTableNumber('')
    setComplaint('')
    setRating(5)
  }

  if (order) {
    return (
      <div className="ticket">
        <h2>Order #{order.id}</h2>
        <p className="status-line">Table: {order.table_number}</p>
        <p className="status-line">Status: <strong>{order.status}</strong></p>
        <p className="status-line">Waiting time: {order.waiting_time_minutes} min</p>
        {order.items && (
  <div className="order-items">
    {order.items.map((item, i) => (
      <div className="summary-row" key={i}>
        <span>{item.name} × {item.quantity}</span>
        <span>₦{item.price * item.quantity}</span>
      </div>
    ))}
    <div className="summary-row total-row">
      <span>Total</span>
      <span>₦{order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)}</span>
    </div>
  </div>
)}
        {order.rating && <p className="status-line">Your rating: {order.rating} ★</p>}
        {order.complaint_text && <p className="status-line">Your complaint: "{order.complaint_text}"</p>}

        {order.status !== 'paid' && (
          <div className="section">
            <h3>Rate your experience (optional)</h3>
            <select value={rating} onChange={e => setRating(Number(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star</option>)}
            </select>
            <button onClick={submitRating}>Submit rating</button>

            <h3>Something wrong? Let us know (optional)</h3>
            <textarea value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Tell us what happened..." />
            <button onClick={submitComplaint} disabled={!complaint.trim()}>Submit complaint</button>

            <h3>Ready to leave?</h3>
            <button className="primary" onClick={pay}>
              Pay ₦{order.items ? order.items.reduce((sum, i) => sum + i.price * i.quantity, 0) : ''} now (pretend payment)
              </button>
          </div>
        )}

        {order.is_paid && (
          <div className="section">
            <p className="paid-stamp">PAID — thank you!</p>
            <button onClick={startNewOrder}>Start a new order</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2>Menu</h2>
      <div className="table-input">
        <label>Table Number</label>
        <input
          type="text"
          value={tableNumber}
          onChange={e => setTableNumber(e.target.value)}
          placeholder="e.g. Table 4"
        />
      </div>

      <div className="menu-list">
        {menu.map(item => (
          <div className="menu-row" key={item.id}>
            <div className="menu-info">
              <span className="menu-name">{item.name}</span>
              <span className="menu-meta">₦{item.price} · {item.prep_time_minutes} min</span>
            </div>
            <div className="stepper">
              <button onClick={() => changeQty(item.id, -1)}>−</button>
              <span>{cart[item.id] || 0}</span>
              <button onClick={() => changeQty(item.id, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      {cartEntries.length > 0 && (
        <div className="order-summary">
          <h3>Your Order</h3>
          {cartEntries.map(([id, qty]) => {
            const item = menu.find(m => m.id === Number(id))
            return item && (
              <div className="summary-row" key={id}>
                <span>{item.name} × {qty}</span>
                <span>₦{item.price * qty}</span>
              </div>
            )
          })}
          <div className="summary-row total-row">
            <span>Total</span>
            <span>₦{total}</span>
          </div>
          <button className="primary" onClick={placeOrder}>Place Order</button>
        </div>
      )}
    </div>
  )
}

export default CustomerView