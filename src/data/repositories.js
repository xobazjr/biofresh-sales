import { mockCustomers, mockOrders } from './mockData'

// Keep UI data access behind repositories. A future Supabase adapter can expose the same methods.
export const customerRepository = {
  list: () => [...mockCustomers],
  getById: (id) => mockCustomers.find((customer) => customer.id === id),
}

export const orderRepository = {
  list: () => [...mockOrders],
  getByCustomerId: (customerId) => mockOrders.filter((order) => order.customerId === customerId),
}
