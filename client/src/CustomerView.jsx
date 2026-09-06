import { useState, useEffect } from 'react'

function CustomerView() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({}) // { menu_item_id: quantity }
  const [order, setOrder] = useState(null)
  const [complaint, setComplaint] = useState('')
  const [rating, setRating] = useState(5)

  useEffect(() => {
    fetch('/api/menu').then(res => res.json()).then(setMenu)
  }, [])

  function addToCart(id) {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  async function placeOrder() {
    const items = Object.entries(cart).map(([menu_item_id, quantity]) => ({
      menu_item_id: Number(menu_item_id), quantity
    }))
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: 'Table 4', items })
    })
    setOrder(await res.json())
  }

  async function refreshOrder() {
    const res = await fetch('/api/orders/' + order.id)
    setOrder(await res.json())
  }

  async function submitComplaint() {
    const res = await fetch('/api/orders/' + order.id + '/complaint', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_text: complaint, rating })
    })
    setOrder(await res.json())
  }

  async function pay() {
    const res = await fetch('/api/orders/' + order.id + '/pay', { method: 'PATCH' })
    setOrder(await res.json())
  }

  if (order) {
    return (
      <div>
        <h2>Order #{order.id}</h2>
        <p>Status: {order.status}</p>
        <p>Estimated waiting time: {order.waiting_time_minutes} minutes</p>
        <button onClick={refreshOrder}>Refresh status</button>

        {order.status !== 'paid' && (
          <div>
            <h3>Delayed? File a complaint</h3>
            <textarea value={complaint} onChange={e => setComplaint(e.target.value)} />
            <select value={rating} onChange={e => setRating(Number(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} star</option>)}
            </select>
            <button onClick={submitComplaint}>Submit complaint</button>

            <h3>Ready to leave?</h3>
            <button onClick={pay}>Pay now (pretend payment)</button>
          </div>
        )}
        {order.is_paid && <p><strong>Paid — thank you!</strong></p>}
      </div>
    )
  }

  return (
    <div>
      <h2>Menu</h2>
      {menu.map(item => (
        <div key={item.id}>
          <span>{item.name} — ₦{item.price} ({item.prep_time_minutes} min)</span>
          <button onClick={() => addToCart(item.id)}>Add ({cart[item.id] || 0})</button>
        </div>
      ))}
      <button onClick={placeOrder} disabled={Object.keys(cart).length === 0}>
        Place Order
      </button>
    </div>
  )
}

export default CustomerView