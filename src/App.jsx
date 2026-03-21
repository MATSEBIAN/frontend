import { useState, useEffect } from 'react'
import { api } from './api.js'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Reports from './pages/Reports.jsx'

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',      icon: '◈' },

  { key: 'reports',      label: 'Reportes',        icon: '◎' },
]

export default function App() {
  const [user, setUser]       = useState(null)
  const [company, setCompany] = useState(null)
  const [page, setPage]       = useState('dashboard')
  const [txType, setTxType]    = useState('expense')
  const [movOpen, setMovOpen]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (api.getToken()) {
      api.me()
        .then(d => { setUser(d.user); setCompany(d.company) })
        .catch(() => api.clearToken())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (data) => {
    api.setToken(data.access_token)
    setUser(data.user)
    setCompany(data.company)
  }

  const handleLogout = () => {
    api.clearToken()
    setUser(null)
    setCompany(null)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <span style={{ color:'var(--gold)', fontFamily:'Cormorant Garamond, serif', fontSize:24, fontStyle:'italic' }}>
        Cargando…
      </span>
    </div>
  )

  if (!user) return <Login onLogin={handleLogin} />

  const pages = { dashboard: Dashboard, reports: Reports }
  const PageComponent = page === 'transactions' ? () => <Transactions defaultType={txType} /> : (pages[page] || Dashboard)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'rgba(0,0,0,0.25)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '0 0 24px',
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize: 11, letterSpacing:'0.3em', color:'var(--gold)', textTransform:'uppercase' }}>
            MATSEBIAN
          </div>
          <div style={{ fontSize: 10, color:'var(--text-muted)', letterSpacing:'0.15em', textTransform:'uppercase', marginTop: 4 }}>
            {company?.name || 'Mi empresa'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px' }}>
          {/* Dashboard */}
          <button onClick={() => setPage('dashboard')} style={{
            display:'flex', alignItems:'center', gap:10,
            width:'100%', padding:'10px 12px', borderRadius:3,
            border:'none', cursor:'pointer', textAlign:'left',
            fontSize:13, letterSpacing:'0.06em',
            background: page==='dashboard' ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: page==='dashboard' ? 'var(--gold)' : 'var(--text-dim)',
            fontFamily:'Jost, sans-serif', transition:'all 0.15s', marginBottom:2,
          }}>
            <span style={{fontSize:16,width:20,textAlign:'center'}}>◆</span>
            Dashboard
            {page==='dashboard' && <span style={{marginLeft:'auto',width:3,height:3,borderRadius:'50%',background:'var(--gold)'}}/>}
          </button>

          {/* Movimientos con submenu */}
          <button onClick={() => setMovOpen(o => !o)} style={{
            display:'flex', alignItems:'center', gap:10,
            width:'100%', padding:'10px 12px', borderRadius:3,
            border:'none', cursor:'pointer', textAlign:'left',
            fontSize:13, letterSpacing:'0.06em',
            background: page==='transactions' ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: page==='transactions' ? 'var(--gold)' : 'var(--text-dim)',
            fontFamily:'Jost, sans-serif', transition:'all 0.15s', marginBottom:2,
          }}>
            <span style={{fontSize:16,width:20,textAlign:'center'}}>⊟</span>
            Movimientos
            <span style={{marginLeft:'auto', fontSize:10, transition:'transform 0.2s', display:'inline-block', transform: movOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▾</span>
          </button>
          {movOpen && (
            <div style={{marginLeft:20, marginBottom:4}}>
              <button onClick={() => { setTxType('income'); setPage('transactions') }} style={{
                display:'flex', alignItems:'center', gap:8,
                width:'100%', padding:'7px 12px', borderRadius:3,
                border:'none', cursor:'pointer', textAlign:'left',
                fontSize:12, letterSpacing:'0.05em',
                background: page==='transactions' && txType==='income' ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: page==='transactions' && txType==='income' ? 'var(--gold)' : 'var(--text-dim)',
                fontFamily:'Jost, sans-serif', transition:'all 0.15s', marginBottom:1,
              }}>
                <span style={{color:'#4caf7d', fontSize:11}}>↑</span> Ingresos
              </button>
              <button onClick={() => { setTxType('expense'); setPage('transactions') }} style={{
                display:'flex', alignItems:'center', gap:8,
                width:'100%', padding:'7px 12px', borderRadius:3,
                border:'none', cursor:'pointer', textAlign:'left',
                fontSize:12, letterSpacing:'0.05em',
                background: page==='transactions' && txType==='expense' ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: page==='transactions' && txType==='expense' ? 'var(--gold)' : 'var(--text-dim)',
                fontFamily:'Jost, sans-serif', transition:'all 0.15s', marginBottom:1,
              }}>
                <span style={{color:'#e57373', fontSize:11}}>↓</span> Gastos
              </button>
            </div>
          )}

          {/* Reportes */}
          <button onClick={() => setPage('reports')} style={{
            display:'flex', alignItems:'center', gap:10,
            width:'100%', padding:'10px 12px', borderRadius:3,
            border:'none', cursor:'pointer', textAlign:'left',
            fontSize:13, letterSpacing:'0.06em',
            background: page==='reports' ? 'rgba(201,168,76,0.12)' : 'transparent',
            color: page==='reports' ? 'var(--gold)' : 'var(--text-dim)',
            fontFamily:'Jost, sans-serif', transition:'all 0.15s', marginBottom:2,
          }}>
            <span style={{fontSize:16,width:20,textAlign:'center'}}>○</span>
            Reportes
            {page==='reports' && <span style={{marginLeft:'auto',width:3,height:3,borderRadius:'50%',background:'var(--gold)'}}/>}
          </button>
        </nav>

        {/* User */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color:'var(--text-dim)', marginBottom: 4 }}>
            {user.full_name}
          </div>
          <div style={{ fontSize: 11, color:'var(--text-muted)', marginBottom: 12 }}>
            {user.email}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background:'transparent', border:'none', color:'var(--text-muted)',
              fontSize:11, cursor:'pointer', letterSpacing:'0.1em',
              textTransform:'uppercase', padding:0, fontFamily:'Jost, sans-serif',
            }}
          >
            Cerrar sesión →
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow:'auto', padding: '32px 40px' }}>
        <PageComponent company={company} user={user} />
      </main>
    </div>
  )
}
