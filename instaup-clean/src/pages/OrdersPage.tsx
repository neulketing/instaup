import React, { useEffect, useState } from 'react'
import { useSocket } from '../hooks/useSocket'

type OrderItem = {
  id: string
  status: string
  progress: number
  // other order fields...
}

async function fetchOrders(): Promise<OrderItem[]> {
  // Implementation to fetch orders from API
  return []
}

function OrdersPage() {
  const socket = useSocket()
  const [orders, setOrders] = useState<OrderItem[]>([])

  useEffect(() => {
    fetchOrders().then(setOrders)
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (update: { orderId: string; status: string; progress: number }) => {
      setOrders(prev => prev.map(o => o.id === update.orderId ? { ...o, status: update.status, progress: update.progress } : o))
    }
    socket.on('order_update', handler)
    return () => {
      socket.off('order_update', handler)
    }
  }, [socket])

  return (
    <div>
      <h1>Orders</h1>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            Order #{order.id}: {order.status} ({order.progress}%)
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OrdersPage
