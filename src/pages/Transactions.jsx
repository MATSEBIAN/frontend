import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

const PM_LABELS = { cash:'Efectivo', card:'Tarjeta', transfer:'Transferencia', delivery_app:'App delivery', other:'Otro' }

function ManualForm({ categories, onSave, onClose }) {
  const [form, setForm] = useState({
    type:'income', amount:'', description:'', payment_method:'cash',
    transaction_date: new Date().toISOString().split('T')[0],
    category_id:'', vendor_client:'', tax_amount:'', notes:''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.createManual({ ...form, amount: parseFloat(form.amount), tax_amount: parseFloat(form.tax_amount||0), category_id: form.category_id ? parseInt(form.category_id) : null })
      onSave()
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'both')

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Tipo */}
      <div style={{ display:'flex', gap:8 }}>
        {[['income','↑ Ingreso'],['expense','↓ Gasto']].map(([v,l]) => (
          <button key={v} type="button" onClick={() => setForm(f=>({...f, type:v, category_id:''}))} style={{
            flex:1, padding:'10px 0', border:`1px solid ${form.type===v ? (v==='income'?'var(--green)':'var(--red-light)') : 'var(--border-sub)'}`,
            borderRadius:3, background: form.type===v ? (v==='income'?'rgba(74,222,128,0.1)':'rgba(204,53,32,0.1)') : 'transparent',
            color: form.type===v ? (v==='income'?'var(--green)':'var(--red-light)') : 'var(--text-dim)',
            cursor:'pointer', fontSize:13, fontFamily:'Jost, sans-serif', fontWeight:500, transition:'all 0.2s',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Importe (€) *</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
        </div>
        <div className="form-group">
          <label className="form-label">IVA incluido (€)</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.tax_amount} onChange={set('tax_amount')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Descripción *</label>
        <input className="input" type="text" placeholder={form.type==='income' ? 'Venta viernes noche, Mesa 12...' : 'Factura Makro, Nómina marzo...'} value={form.description} onChange={set('description')} required />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input className="input" type="date" value={form.transaction_date} onChange={set('transaction_date')} />
        </div>
        <div className="form-group">
          <label className="form-label">Método de pago</label>
          <select className="input" value={form.payment_method} onChange={set('payment_method')}>
            {Object.entries(PM_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div className="form-group">
          <label className="form-label">Categoría</label>
          <select className="input" value={form.category_id} onChange={set('category_id')}>
            <option value="">Sin categoría</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{form.type==='income' ? 'Cliente' : 'Proveedor'} (opcional)</label>
          <input className="input" type="text" placeholder={form.type==='income' ? 'Nombre del cliente' : 'Makro, El Corte Inglés...'} value={form.vendor_client} onChange={set('vendor_client')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notas (opcional)</label>
        <input className="input" type="text" placeholder="Cualquier detalle relevante" value={form.notes} onChange={set('notes')} />
      </div>

      {error && <div style={{ background:'rgba(204,53,32,0.1)', border:'1px solid rgba(204,53,32,0.3)', borderRadius:3, padding:'10px 14px', color:'var(--red-light)', fontSize:13 }}>{error}</div>}

      <div style={{ display:'flex', gap:10, marginTop:4 }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar movimiento'}</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  )
}

function UploadForm({ onSave, onClose }) {
  const [file, setFile]       = useState(null)
  const [type, setType]       = useState('expense')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const fileRef = useRef()

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Selecciona un archivo')
    setError(''); setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', type)
      await api.uploadDocument(fd)
      onSave()
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', gap:8 }}>
        {[['income','↑ Ingreso'],['expense','↓ Gasto']].map(([v,l]) => (
          <button key={v} type="button" onClick={() => setType(v)} style={{
            flex:1, padding:'10px 0', border:`1px solid ${type===v ? (v==='income'?'var(--green)':'var(--red-light)') : 'var(--border-sub)'}`,
            borderRadius:3, background: type===v ? (v==='income'?'rgba(74,222,128,0.1)':'rgba(204,53,32,0.1)') : 'transparent',
            color: type===v ? (v==='income'?'var(--green)':'var(--red-light)') : 'var(--text-dim)',
            cursor:'pointer', fontSize:13, fontFamily:'Jost, sans-serif', fontWeight:500, transition:'all 0.2s',
          }}>{l}</button>
        ))}
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${file ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius:4, padding:'32px 20px', textAlign:'center', cursor:'pointer',
          background: file ? 'rgba(201,168,76,0.05)' : 'transparent', transition:'all 0.2s',
        }}
      >
        <div style={{ fontSize:24, marginBottom:10 }}>📄</div>
        <div style={{ fontSize:13, color: file ? 'var(--gold)' : 'var(--text-dim)' }}>
          {file ? file.name : 'Clic para seleccionar factura o ticket'}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
          PDF, JPG, PNG · máx. 16MB
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display:'none' }}
          onChange={e => setFile(e.target.files[0] || null)} />
      </div>

      {file && (
        <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid var(--border)', borderRadius:3, padding:'10px 14px', fontSize:13, color:'var(--text-dim)' }}>
          La IA extraerá proveedor, importe, fecha y categoría automáticamente.
        </div>
      )}

      {error && <div style={{ background:'rgba(204,53,32,0.1)', border:'1px solid rgba(204,53,32,0.3)', borderRadius:3, padding:'10px 14px', color:'var(--red-light)', fontSize:13 }}>{error}</div>}

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-primary" type="submit" disabled={loading || !file}>{loading ? 'Procesando con IA…' : 'Subir y procesar'}</button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  )
}

export default function Transactions() {
  const [txs, setTxs]             = useState([])
  const [cats, setCats]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [mode, setMode]           = useState(null) // null | 'manual' | 'upload'
  const [filter, setFilter]       = useState({ type:'', month:'', year:'' })

  const today = new Date()

  const load = () => {
    setLoading(true)
    const params = {}
    if (filter.type)  params.type  = filter.type
    if (filter.month) params.month = filter.month
    if (filter.year)  params.year  = filter.year
    api.getTransactions(params).then(setTxs).finally(() => setLoading(false))
  }

  useEffect(() => { api.getCategories().then(setCats) }, [])
  useEffect(() => { load() }, [filter])

  const saved = () => { setMode(null); load() }
  const del = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await api.deleteTransaction(id); load()
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom:8 }}>Movimientos</div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300 }}>Ingresos y Gastos</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => setMode(mode==='upload' ? null : 'upload')}>
            📄 Subir factura
          </button>
          <button className="btn btn-primary" onClick={() => setMode(mode==='manual' ? null : 'manual')}>
            + Registrar manual
          </button>
        </div>
      </div>

      {/* Formularios */}
      {mode && (
        <div className="card" style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', marginBottom:20 }}>
            {mode === 'manual' ? 'Nuevo movimiento manual' : 'Subir documento (OCR automático)'}
          </div>
          {mode === 'manual'
            ? <ManualForm categories={cats} onSave={saved} onClose={() => setMode(null)} />
            : <UploadForm onSave={saved} onClose={() => setMode(null)} />}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <select className="input" style={{ width:'auto' }} value={filter.type} onChange={e => setFilter(f=>({...f, type:e.target.value}))}>
          <option value="">Todos</option>
          <option value="income">Solo ingresos</option>
          <option value="expense">Solo gastos</option>
        </select>
        <select className="input" style={{ width:'auto' }} value={filter.month} onChange={e => setFilter(f=>({...f, month:e.target.value}))}>
          <option value="">Todos los meses</option>
          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m,i) =>
            <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="input" style={{ width:'auto' }} value={filter.year} onChange={e => setFilter(f=>({...f, year:e.target.value}))}>
          <option value="">Todos los años</option>
          {[today.getFullYear(), today.getFullYear()-1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {(filter.type || filter.month || filter.year) && (
          <button className="btn btn-ghost" style={{ padding:'8px 14px' }} onClick={() => setFilter({type:'',month:'',year:''})}>✕ Limpiar</button>
        )}
      </div>

      {/* Lista */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Cargando…</div>
        ) : txs.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
            No hay movimientos.{' '}
            <span style={{ color:'var(--gold)', cursor:'pointer' }} onClick={() => setMode('manual')}>Registra el primero →</span>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Fecha','Descripción','Categoría','Método','Origen','Importe',''].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:h==='Importe'||h===''?'right':'left', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom: i < txs.length-1 ? '1px solid var(--border-sub)' : 'none', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-dim)' }}>{tx.transaction_date}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, maxWidth:220 }}>
                    <div style={{ color:'var(--cream)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.description || tx.vendor_client || '—'}</div>
                    {tx.vendor_client && tx.description && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{tx.vendor_client}</div>}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-dim)' }}>{tx.category || '—'}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-dim)' }}>{PM_LABELS[tx.payment_method] || tx.payment_method}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span className={`badge badge-${tx.source}`}>{tx.source === 'manual' ? 'Manual' : 'Doc'}</span>
                  </td>
                  <td style={{ padding:'12px 16px', textAlign:'right' }}>
                    <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300,
                      color: tx.type==='income' ? 'var(--green)' : 'var(--red-light)' }}>
                      {tx.type==='income' ? '+' : '-'}€{Number(tx.amount).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', textAlign:'right' }}>
                    <button onClick={() => del(tx.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14, opacity:0.5, transition:'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.5'}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
