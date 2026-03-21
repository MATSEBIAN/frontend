import { useState, useEffect } from 'react'
import { api } from '../api.js'

export default function Ingresos() {
  const [mode, setMode]       = useState(null)
  const [txs, setTxs]         = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ month:'', year:'' })

  const load = async () => {
    setLoading(true)
    try {
      const params = { type: 'income' }
      if (filter.month) params.month = filter.month
      if (filter.year)  params.year  = filter.year
      const data = await api.getTransactions(params)
      setTxs(data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const saved = () => { setMode(null); load() }

  const totalSinIva = txs.reduce((s, t) => s + (Number(t.amount) - Number(t.tax_amount||0)), 0)
  const totalConIva = txs.reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div style={{ padding:'32px 40px', maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:'0.2em', color:'var(--gold)', textTransform:'uppercase', marginBottom:6 }}>INGRESOS</div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, color:'var(--cream)', margin:0 }}>Registro de Ingresos</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setMode(mode==='manual' ? null : 'manual')}>
          + Registrar ingreso
        </button>
      </div>

      {/* Totales */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <div className="card" style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:11, letterSpacing:'0.1em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:6 }}>Total sin IVA</div>
          <div style={{ fontSize:24, color:'var(--green)', fontFamily:'Cormorant Garamond, serif' }}>
            {totalSinIva.toLocaleString('es-ES', { minimumFractionDigits:2 })} €
          </div>
        </div>
        <div className="card" style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:11, letterSpacing:'0.1em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:6 }}>Total con IVA</div>
          <div style={{ fontSize:24, color:'var(--green)', fontFamily:'Cormorant Garamond, serif' }}>
            {totalConIva.toLocaleString('es-ES', { minimumFractionDigits:2 })} €
          </div>
        </div>
      </div>

      {/* Formulario */}
      {mode === 'manual' && (
        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:20 }}>
            Nuevo ingreso
          </div>
          <IngresoForm onSave={saved} onClose={() => setMode(null)} />
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <select className="input" style={{ width:'auto' }} value={filter.month} onChange={e => setFilter(f=>({...f, month:e.target.value}))}>
          <option value="">Todos los meses</option>
          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m,i) =>
            <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="input" style={{ width:'auto' }} value={filter.year} onChange={e => setFilter(f=>({...f, year:e.target.value}))}>
          <option value="">Todos los años</option>
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['FECHA','DESCRIPCIÓN','MÉTODO','SIN IVA','IVA','CON IVA'].map(h => (
                <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)', fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'var(--text-muted)' }}>Cargando...</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'var(--text-muted)' }}>Sin ingresos registrados</td></tr>
            ) : txs.map(tx => {
              const sinIva = Number(tx.amount) - Number(tx.tax_amount||0)
              const iva    = Number(tx.tax_amount||0)
              const conIva = Number(tx.amount)
              return (
                <tr key={tx.id} style={{ borderBottom:'1px solid var(--border-sub)' }}>
                  <td style={{ padding:'10px 16px', color:'var(--text-dim)' }}>{tx.transaction_date}</td>
                  <td style={{ padding:'10px 16px', color:'var(--cream)' }}>{tx.description || tx.vendor_client || '—'}</td>
                  <td style={{ padding:'10px 16px', color:'var(--text-dim)' }}>{tx.payment_method || '—'}</td>
                  <td style={{ padding:'10px 16px', color:'var(--green)', textAlign:'right' }}>{sinIva.toFixed(2)}</td>
                  <td style={{ padding:'10px 16px', color:'var(--text-dim)', textAlign:'right' }}>{iva.toFixed(2)}</td>
                  <td style={{ padding:'10px 16px', color:'var(--green)', fontWeight:500, textAlign:'right' }}>{conIva.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function IngresoForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    type: 'income', amount: '', tax_amount: '', description: '-',
    payment_method: 'cash',
    transaction_date: new Date().toISOString().split('T')[0],
    category_id: null, vendor_client: '', notes: ''
  })
  const [amountConIva, setAmountConIva] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChangeSinIva = e => {
    const v = e.target.value
    setForm(f => ({ ...f, amount: v, tax_amount: v ? (parseFloat(v)*0.1).toFixed(2) : '' }))
    setAmountConIva(v ? (parseFloat(v)*1.1).toFixed(2) : '')
  }
  const onChangeConIva = e => {
    const v = e.target.value
    const sinIva = v ? (parseFloat(v)/1.1).toFixed(2) : ''
    setForm(f => ({ ...f, amount: sinIva, tax_amount: sinIva ? (parseFloat(sinIva)*0.1).toFixed(2) : '' }))
    setAmountConIva(v)
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.createManual({ ...form, amount: parseFloat(form.amount), tax_amount: parseFloat(form.tax_amount||0) })
      onSave()
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Importe sin IVA *</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={onChangeSinIva} required />
        </div>
        <div className="form-group">
          <label className="form-label">Importe IVA incluido (10%)</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={amountConIva} onChange={onChangeConIva} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="input" type="date" value={form.transaction_date} onChange={e => setForm(f=>({...f, transaction_date:e.target.value}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Método de pago</label>
          <select className="input" value={form.payment_method} onChange={e => setForm(f=>({...f, payment_method:e.target.value}))}>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
      {error && <div style={{ color:'var(--red-light)', fontSize:12 }}>{error}</div>}
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar ingreso'}</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  )
}
