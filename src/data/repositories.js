import { mockCustomers, mockOrders, mockSalesActivities, mockSalesPlans, mockSalesTeam } from './mockData'

// Temporary in-browser data layer. It keeps the UI connected without requiring
// a database yet, while exposing a small API that can later be backed by Supabase.
const STORAGE_KEY = 'biofresh-sales-mock-workspace'
const CHANNEL_NAME = 'biofresh-sales-mock-workspace'
const clone = (value) => JSON.parse(JSON.stringify(value))
const createInitialState = () => ({ customers: clone(mockCustomers), orders: clone(mockOrders), salesPlans: clone(mockSalesPlans), salesActivities: clone(mockSalesActivities), salesTeam: clone(mockSalesTeam) })
const isValidState = (value) => Boolean(value && Array.isArray(value.customers) && Array.isArray(value.orders))
const mergeSalesPlans = (savedPlans) => {
  const savedById = new Map((savedPlans || []).map((plan) => [plan.id, plan]))
  const seeded = mockSalesPlans.map((plan) => ({ ...clone(plan), ...(savedById.get(plan.id) || {}) }))
  const newPlans = (savedPlans || []).filter((plan) => !mockSalesPlans.some((seed) => seed.id === plan.id))
  return [...seeded, ...clone(newPlans)]
}
const mergeSalesTeam = (savedTeam) => {
  const savedById = new Map((savedTeam || []).map((member) => [member.id, member]))
  const seeded = mockSalesTeam.map((member) => ({ ...clone(member), ...(savedById.get(member.id) || {}) }))
  const newMembers = (savedTeam || []).filter((member) => !mockSalesTeam.some((seed) => seed.id === member.id))
  return [...seeded, ...clone(newMembers)]
}

let state = createInitialState()
const listeners = new Set()
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null

if (typeof window !== 'undefined') {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    if (isValidState(parsed)) state = { ...createInitialState(), ...parsed, salesPlans: mergeSalesPlans(parsed.salesPlans), salesActivities: parsed.salesActivities || clone(mockSalesActivities), salesTeam: mergeSalesTeam(parsed.salesTeam) }
  } catch { /* memory-only fallback */ }
}

const notify = () => listeners.forEach((listener) => listener())
const commit = (nextState, shouldBroadcast = true) => {
  state = nextState
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* memory-only fallback */ }
  }
  if (shouldBroadcast) channel?.postMessage(state)
  notify()
}

channel?.addEventListener('message', (event) => {
  if (isValidState(event.data)) commit(clone(event.data), false)
})

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      const next = JSON.parse(event.newValue)
      if (isValidState(next)) commit(next, false)
    } catch { /* ignore malformed temporary storage */ }
  })
}

const todayLabel = () => 'วันนี้'
const parseAmount = (value) => Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0
const formatAmount = (value) => `฿ ${value.toLocaleString('en-US')}`
const validStatuses = new Set(['planning', 'production', 'ready', 'shipped'])

export const mockWorkspace = {
  getSnapshot: () => state,
  subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
  reset: () => commit(createInitialState()),
  addCustomer: (customer) => {
    const id = `cus_${Date.now()}`
    const nextCustomer = {
      id, ...customer, initials: customer.name.slice(0, 2), status: 'ลูกค้าใหม่', statusTone: 'info',
      lastOrder: 'ยังไม่มีคำสั่งซื้อ', total: '฿ 0', totalAmount: 0, avatarTone: 'avatar-sky',
      notes: customer.notes || 'ยังไม่มีโน้ต', activities: [{ date: todayLabel(), title: 'สร้างโปรไฟล์ลูกค้า', detail: 'เพิ่มโดย นรินทร์ ส.' }],
    }
    commit({ ...state, customers: [nextCustomer, ...state.customers] })
    return nextCustomer
  },
  addOrder: (orderInput) => {
    const customer = state.customers.find((item) => item.id === orderInput.customerId)
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND')
    const amount = parseAmount(orderInput.total)
    const nextOrder = {
      id: `ord_${Date.now()}`, number: `BF-${String(Date.now()).slice(-6)}`, ...orderInput,
      customer: customer.company, totalAmount: amount, status: 'planning', statusLabel: 'รอเริ่มงาน',
      statusHistory: [{ status: 'planning', label: 'รอเริ่มงาน', date: todayLabel() }],
    }
    const existingTotal = customer.totalAmount || parseAmount(customer.total)
    const nextCustomer = {
      ...customer, lastOrder: todayLabel(), totalAmount: existingTotal + amount, total: formatAmount(existingTotal + amount),
      activities: [{ date: todayLabel(), title: 'สร้างคำสั่งซื้อใหม่', detail: `${nextOrder.product} · ${nextOrder.total}` }, ...customer.activities],
    }
    commit({ customers: state.customers.map((item) => item.id === customer.id ? nextCustomer : item), orders: [nextOrder, ...state.orders] })
    return nextOrder
  },
  updateOrderStatus: (id, status, statusLabel) => {
    const existing = state.orders.find((item) => item.id === id)
    if (!existing || existing.status === status || !validStatuses.has(status)) return
    const nextOrder = { ...existing, status, statusLabel, statusHistory: [...(existing.statusHistory || []), { status, label: statusLabel, date: todayLabel() }] }
    commit({ ...state, orders: state.orders.map((item) => item.id === id ? nextOrder : item) })
  },
  updateSalesPlanStage: (id, stage, stageLabel) => {
    if (!state.salesPlans.some((item) => item.id === id)) return
    commit({ ...state, salesPlans: state.salesPlans.map((item) => item.id === id ? { ...item, stage, stageLabel } : item) })
  },
  createSalesActivity: (activity) => {
    const nextActivity = { id: `plan_${Date.now()}`, stage: 'qualified', stageLabel: 'ยืนยันความต้องการ', priority: 'กลาง', attachments: [], images: [], participants: [], products: [], ...activity }
    commit({ ...state, salesPlans: [nextActivity, ...state.salesPlans] })
    return nextActivity
  },
  updateSalesActivity: (id, activity) => {
    if (!state.salesPlans.some((item) => item.id === id)) return
    commit({ ...state, salesPlans: state.salesPlans.map((item) => item.id === id ? { ...item, ...activity } : item) })
  },
  toggleSalesActivity: (id) => {
    if (!state.salesActivities.some((item) => item.id === id)) return
    commit({ ...state, salesActivities: state.salesActivities.map((item) => item.id === id ? { ...item, completed: !item.completed } : item) })
  },
  addSalesMember: (member) => {
    const nextMember = { id: `member_${Date.now()}`, status: 'online', statusLabel: 'ออนไลน์', monthlySales: 0, monthlyTarget: Number(member.monthlyTarget) || 0, annualSales: 0, annualTarget: Number(member.annualTarget) || 0, followUps: 0, latestActivity: 'ยังไม่มีกิจกรรม', latestActivityTime: '-', assignedTasks: [], progress: { activities: 0, closedDeals: 0, newCustomers: 0 }, documents: [], ...member }
    commit({ ...state, salesTeam: [nextMember, ...state.salesTeam] })
    return nextMember
  },
  updateSalesMember: (id, member) => {
    if (!state.salesTeam.some((item) => item.id === id)) return
    commit({ ...state, salesTeam: state.salesTeam.map((item) => item.id === id ? { ...item, ...member } : item) })
  },
  deleteSalesMember: (id) => {
    commit({ ...state, salesTeam: state.salesTeam.filter((item) => item.id !== id) })
  },
  assignSalesTask: (id, task) => {
    commit({ ...state, salesTeam: state.salesTeam.map((item) => item.id === id ? { ...item, assignedTasks: [...(item.assignedTasks || []), { id: `task_${Date.now()}`, title: task.title, due: task.due || '-', status: 'รอทำ' }] } : item) })
  },
  addSalesDocument: (id, document) => {
    commit({ ...state, salesTeam: state.salesTeam.map((item) => item.id === id ? { ...item, documents: [...(item.documents || []), { id: `doc_${Date.now()}`, ...document }] } : item) })
  },
}

// Keep the repository names as a migration-friendly interface for future API adapters.
export const customerRepository = {
  list: () => state.customers,
  getById: (id) => state.customers.find((customer) => customer.id === id),
}

export const orderRepository = {
  list: () => state.orders,
  getByCustomerId: (customerId) => state.orders.filter((order) => order.customerId === customerId),
}
