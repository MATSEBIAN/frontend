import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { api } from '../api.js'

const PM_LABELS = { cash:'Efectivo', card:'Tarjeta', transfer:'Transferencia', delivery_app:'App delivery', other:'Otro' }

const thS = { padding:'6px 10px', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase',
  color:'var(--text-muted)', fontWeight:500, whiteSpace:'nowrap',
  borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.2)', position:'sticky', top:0 }
const tdS = { padding:'4px 8px', fontSize:11, color:'var(--cream)', whiteSpace:'nowrap',
  borderBottom:'1px solid rgba(255,255,255,0.04)' }

function ECell({ tx, field, w, onSave, onLiveUpdate, type='text', right=false }) {
  const [v, setV] = useState(tx[field] || '')
  useEffect(() => setV(tx[field] || ''), [tx.id, tx[field]])
  const handleChange = e => {
    setV(e.target.value)
    if (onLiveUpdate) onLiveUpdate(field, e.target.value)
  }
  return (
    <td style={{ ...tdS, minWidth:w, maxWidth:w, overflow:'hidden', padding:'4px 8px' }}>
      <input type={type} value={v} onChange={handleChange}
        onBlur={() => { if (String(v) !== String(tx[field] || '')) onSave(field, v) }}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        style={{ background:'transparent', border:'none', width:'100%', color:'var(--cream)',
          fontSize:11, fontFamily:'Jost,sans-serif', padding:0, outline:'none',
          textAlign: right ? 'right' : 'left' }} />
    </td>
  )
}

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
  const [files, setFiles]       = useState([])
  const [type, setType]         = useState('expense')
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.size <= 16*1024*1024)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !existing.has(f.name))]
    })
  }

  const removeFile = (name) => setFiles(f => f.filter(x => x.name !== name))

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!files.length) return setError('Selecciona al menos un archivo')
    setError(''); setLoading(true)
    const results = []
    for (const file of files) {
      setProgress(prev => [...prev.filter(p => p.name !== file.name), { name: file.name, status: 'procesando' }])
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('type', type)
        fd.append('filename', file.name.replace(/\.[^/.]+$/, ''))
        await api.uploadDocument(fd)
        results.push({ name: file.name, status: 'ok' })
      } catch(err) {
        results.push({ name: file.name, status: 'error', error: err.message })
      }
      setProgress([...results])
    }
    setLoading(false)
    if (results.every(r => r.status === 'ok')) {
      setTimeout(onSave, 800)
    }
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

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--gold)' : files.length ? 'var(--green)' : 'var(--border)'}`,
          borderRadius:4, padding:'32px 20px', textAlign:'center', cursor:'pointer',
          background: dragging ? 'rgba(201,168,76,0.08)' : files.length ? 'rgba(74,222,128,0.04)' : 'transparent',
          transition:'all 0.2s',
        }}
      >
        <div style={{ fontSize:28, marginBottom:10 }}>{dragging ? '⬇️' : '📄'}</div>
        <div style={{ fontSize:14, color: dragging ? 'var(--gold)' : 'var(--text-dim)', fontWeight:500 }}>
          {dragging ? 'Suelta aquí' : 'Arrastra facturas aquí o haz clic para seleccionar'}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>
          PDF, JPG, PNG · múltiples archivos · máx. 16MB cada uno
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple style={{ display:'none' }}
          onChange={e => addFiles(e.target.files)} />
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {files.map(f => {
            const p = progress.find(x => x.name === f.name)
            return (
              <div key={f.name} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(0,0,0,0.15)', borderRadius:3, padding:'8px 12px' }}>
                <span style={{ fontSize:13, flex:1, color:'var(--cream)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)', flexShrink:0 }}>{(f.size/1024).toFixed(0)} KB</span>
                {p && (
                  <span style={{ fontSize:12, flexShrink:0, color: p.status==='ok' ? 'var(--green)' : p.status==='error' ? 'var(--red-light)' : 'var(--gold)' }}>
                    {p.status==='ok' ? '✓ listo' : p.status==='error' ? '✗ ' + p.error : '⟳ procesando…'}
                  </span>
                )}
                {!loading && !p && (
                  <button type="button" onClick={() => removeFile(f.name)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14, flexShrink:0 }}>✕</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {files.length > 0 && !progress.length && (
        <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid var(--border)', borderRadius:3, padding:'10px 14px', fontSize:13, color:'var(--text-dim)' }}>
          La IA extraerá proveedor, importe, fecha y categoría de cada archivo automáticamente.
        </div>
      )}

      {error && <div style={{ background:'rgba(204,53,32,0.1)', border:'1px solid rgba(204,53,32,0.3)', borderRadius:3, padding:'10px 14px', color:'var(--red-light)', fontSize:13 }}>{error}</div>}

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-primary" type="submit" disabled={loading || !files.length}>
          {loading
            ? `Procesando ${progress.length}/${files.length}…`
            : files.length > 1 ? `Subir y procesar (${files.length} archivos)` : 'Subir y procesar'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  )
}

export default function Transactions() {
  const [txs, setTxs]             = useState([])
  const [cats, setCats]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [mode, setMode]           = useState(null)
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

  const [selected, setSelected] = useState(new Set())
  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === txs.length ? new Set() : new Set(txs.map(t => t.id)))

  const API = import.meta.env.VITE_API_URL
  const authH = () => ({ 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` })

  const patchTx = async (id, field, val) => {
    setTxs(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
    try {
      await fetch(`${API}/api/transactions/${id}`, {
        method: 'PATCH', headers: authH(), body: JSON.stringify({ [field]: val })
      })
    } catch(e) { console.error('patch error', e) }
  }

  const saved = () => { setMode(null); load() }
  const del = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await api.deleteTransaction(id); load()
  }
  const updateCategory = async (txId, catId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/${txId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ category_id: catId ? parseInt(catId) : null })
      })
      setTxs(prev => prev.map(t => t.id === txId ? { ...t, category_id: catId, category: cats.find(c=>c.id==catId)?.name || '' } : t))
    } catch(e) { console.error(e) }
  }

  const delSelected = async () => {
    if (!selected.size || !confirm(`¿Eliminar ${selected.size} movimiento(s)?`)) return
    await Promise.all([...selected].map(id => api.deleteTransaction(id)))
    setSelected(new Set()); load()
  }
  const delAll = async () => {
    if (!confirm(`¿Eliminar TODOS los ${txs.length} movimientos? Esta acción no se puede deshacer.`)) return
    await Promise.all(txs.map(t => api.deleteTransaction(t.id)))
    setSelected(new Set()); load()
  }

  const exportExcel = async () => {
    try {
      const all = txs
      const headers = ['#','PROVEEDOR','LOCAL','FECHA','FACTURA','P AND L','CONCEPTO','BASE','IVA','TOTAL FACT','ALBARAN/IRPF','REVISADO','PAGADO','NOTAS','NOTA 2','NOTA 3','CIF','NO FACTURA','REGISTRO','ACREEDOR']
      const wsData = [headers]
      all.forEach((tx, i) => {
        const row = i + 2 // excel row (1=header)
        const d = new Date(tx.transaction_date)
        const pAndL = new Date(d.getFullYear(), d.getMonth(), 1)
        const toSerial = dt => Math.round((dt - new Date(1899,11,30)) / 86400000)
        const base = tx.type === 'expense' ? -Math.abs(Number(tx.amount) - Number(tx.tax_amount||0)) : Number(tx.amount)
        const iva  = tx.type === 'expense' ? -Math.abs(Number(tx.tax_amount||0)) : 0
        wsData.push([
          i+1,
          tx.vendor_client || tx.description || '',
          tx.local || 'Madrid',
          d,
          tx.description || '',
          pAndL,
          tx.category || tx.concepto || '',
          base,
          iva,
          { f: `I${row}+H${row}` },
          tx.albaran_irpf || '',
          tx.revisado || '',
          tx.pagado || '',
          tx.notes || '',
          tx.nota2 || '',
          tx.nota3 || '',
          tx.cif_proveedor || '',
          tx.num_factura || '',
          tx.created_at ? new Date(tx.created_at).toLocaleString('es-ES') : new Date().toLocaleString('es-ES'),
          tx.acreedor || 'Sabores Adelitas SL',
        ])
      })
      const ws = XLSX.utils.aoa_to_sheet(wsData, { cellDates: true })
      all.forEach((tx, i) => {
        const r = i+1
        const d2 = new Date(tx.transaction_date)
        const dCell = XLSX.utils.encode_cell({r, c:3})
        const pCell = XLSX.utils.encode_cell({r, c:5})
        if (ws[dCell]) { ws[dCell].t = 'n'; ws[dCell].v = Math.round((d2 - new Date(1899,11,30))/86400000); ws[dCell].z = 'dd-mmm-yy' }
        const p = new Date(d2.getFullYear(), d2.getMonth(), 1)
        ws[pCell] = { t: 'n', v: Math.round((p - new Date(1899,11,30))/86400000), z: 'mmm-yy' }
      })
      ws['!cols'] = [4,30,10,12,20,10,15,10,8,10,12,10,10,20,10,10,14,20,18,20].map(w => ({ wch: w }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Facturas')
      const month = new Date().toISOString().slice(0,7)
      XLSX.writeFile(wb, `facturas_${month}.xlsx`)
    } catch(e) { alert('Error al exportar: ' + e.message) }
  }

  return (
    <div className="fade-up">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom:8 }}>Movimientos</div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300 }}>Ingresos y Gastos</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={exportExcel} style={{ fontSize:13 }}>
            ⬇ Excel
          </button>
          {selected.size > 0 && (
            <button className="btn btn-ghost" onClick={delSelected} style={{ fontSize:13, color:'var(--red-light)', borderColor:'var(--red-light)' }}>
              🗑 Borrar {selected.size} seleccionada(s)
            </button>
          )}
          <button className="btn btn-ghost" onClick={delAll} style={{ fontSize:13, color:'var(--text-muted)' }}>
            🗑 Borrar todo
          </button>
          <button className="btn btn-ghost" onClick={() => setMode(mode==='upload' ? null : 'upload')}>
            📄 Subir factura
          </button>
          <button className="btn btn-primary" onClick={() => setMode(mode==='manual' ? null : 'manual')}>
            + Registrar manual
          </button>
        </div>
      </div>

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

      <div className="card" style={{ padding:0, overflow:'auto' }}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Cargando…</div>
        ) : txs.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
            No hay movimientos.{' '}
            <span style={{ color:'var(--gold)', cursor:'pointer' }} onClick={() => setMode('manual')}>Registra el primero →</span>
          </div>
        ) : (
          <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth:2100 }}>
            <thead>
              <tr>
                <th style={{ ...thS, width:32, textAlign:'center' }}>
                  <input type="checkbox" checked={txs.length > 0 && selected.size === txs.length} onChange={toggleAll} style={{ cursor:'pointer', accentColor:'var(--gold)' }}/>
                </th>
                <th style={{ ...thS, width:30 }}>#</th>
                <th style={{ ...thS, width:190 }}>PROVEEDOR</th>
                <th style={{ ...thS, width:80 }}>LOCAL</th>
                <th style={{ ...thS, width:105 }}>FECHA</th>
                <th style={{ ...thS, width:150 }}>FACTURA</th>
                <th style={{ ...thS, width:75 }}>P AND L</th>
                <th style={{ ...thS, width:165 }}>CONCEPTO</th>
                <th style={{ ...thS, width:85, textAlign:'right' }}>BASE</th>
                <th style={{ ...thS, width:75, textAlign:'right' }}>IVA</th>
                <th style={{ ...thS, width:90, textAlign:'right' }}>TOTAL FACT</th>
                <th style={{ ...thS, width:100 }}>ALBARAN/IRPF</th>
                <th style={{ ...thS, width:75 }}>REVISADO</th>
                <th style={{ ...thS, width:75 }}>PAGADO</th>
                <th style={{ ...thS, width:140 }}>NOTAS</th>
                <th style={{ ...thS, width:85 }}>NOTA 2</th>
                <th style={{ ...thS, width:85 }}>NOTA 3</th>
                <th style={{ ...thS, width:105 }}>CIF</th>
                <th style={{ ...thS, width:150 }}>NO FACTURA</th>
                <th style={{ ...thS, width:130 }}>REGISTRO</th>
                <th style={{ ...thS, width:150 }}>ACREEDOR</th>
                <th style={{ ...thS, width:32 }}></th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => {
                const d = new Date(tx.transaction_date)
                const mn = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
                const pAndL = `${mn[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`
                const base  = tx.type === 'expense' ? -(Number(tx.amount) - Number(tx.tax_amount||0)) : Number(tx.amount)
                const iva   = tx.type === 'expense' ? -Number(tx.tax_amount||0) : 0
                const total = tx.type === 'expense' ? -Number(tx.amount) : Number(tx.amount)
                const save  = (field, val) => patchTx(tx.id, field, val)
                const live  = (field, val) => setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, [field]: val } : t))
                return (
                  <tr key={tx.id}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ ...tdS, width:32, textAlign:'center' }}>
                      <input type="checkbox" checked={selected.has(tx.id)} onChange={() => toggleSelect(tx.id)} style={{ cursor:'pointer', accentColor:'var(--gold)' }}/>
                    </td>
                    <td style={{ ...tdS, color:'var(--text-muted)', width:30 }}>{i+1}</td>
                    <ECell tx={tx} field="vendor_client" w={190} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="local" w={80} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="transaction_date" w={105} type="date" onSave={save}/>
                    <ECell tx={tx} field="description" w={150} onSave={save} onLiveUpdate={live}/>
                    <td style={{ ...tdS, color:'var(--text-dim)', width:75 }}>{pAndL}</td>
                    <td style={{ ...tdS, width:165 }}>
                      <select value={tx.category_id || ''} onChange={e => { updateCategory(tx.id, e.target.value); patchTx(tx.id, 'category_id', e.target.value) }}
                        style={{ background:'transparent', border:'1px solid transparent', color:'var(--cream)', fontSize:10,
                          borderRadius:3, padding:'2px 4px', cursor:'pointer', width:'100%', fontFamily:'Jost,sans-serif' }}
                        onMouseEnter={e => e.target.style.borderColor='var(--border)'}
                        onMouseLeave={e => e.target.style.borderColor='transparent'}>
                        <option value="">—</option>
                        {cats.filter(c => c.type==='expense'||c.type==='both').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...tdS, textAlign:'right', width:85, color: base < 0 ? 'var(--red-light)' : 'var(--green)' }}>{base.toFixed(2)}</td>
                    <td style={{ ...tdS, textAlign:'right', width:75, color:'var(--text-dim)' }}>{iva.toFixed(2)}</td>
                    <td style={{ ...tdS, textAlign:'right', width:90, fontWeight:500, color: total < 0 ? 'var(--red-light)' : 'var(--green)' }}>{total.toFixed(2)}</td>
                    <ECell tx={tx} field="albaran_irpf" w={100} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="revisado" w={75} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="pagado" w={75} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="notes" w={140} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="nota2" w={85} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="nota3" w={85} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="cif_proveedor" w={105} onSave={save} onLiveUpdate={live}/>
                    <ECell tx={tx} field="num_factura" w={150} onSave={save} onLiveUpdate={live}/>
                    <td style={{ ...tdS, color:'var(--text-muted)', fontSize:10, width:130 }}>{tx.created_at ? new Date(tx.created_at).toLocaleString('es-ES') : ''}</td>
                    <ECell tx={tx} field="acreedor" w={150} onSave={save} onLiveUpdate={live}/>

                    <td style={{ ...tdS, textAlign:'right', width:32 }}>
                      <button onClick={() => del(tx.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:12, opacity:0.4, transition:'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.4'}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
