import { useState, useEffect } from 'react'
import { api } from '../api.js'

const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reports() {
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [generating, setGen]    = useState(false)
  const [deleting, setDel]      = useState(false)
  const [selected, setSelected] = useState(null)
  const today = new Date()
  const [genMonth, setGenMonth] = useState(today.getMonth()+1)
  const [genYear,  setGenYear]  = useState(today.getFullYear())

  const load = () => {
    setLoading(true)
    api.getReports().then(setReports).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const generate = async () => {
    setGen(true)
    try {
      const r = await api.generateReport(genYear, genMonth)
      setReports(prev => {
        const filtered = prev.filter(x => !(x.month===r.month && x.year===r.year))
        return [r, ...filtered].sort((a,b) => b.year-a.year || b.month-a.month)
      })
      setSelected(norm(r))
    } catch(e) { alert(e.message) }
    finally { setGen(false) }
  }

  const deleteAll = async () => {
    if (!window.confirm('¿Borrar todos los reportes? Esta acción no se puede deshacer.')) return
    setDel(true)
    try {
    await api.deleteAllReports()
      setReports([])
      setSelected(null)
    } catch(e) { alert(e.message) }
    finally { setDel(false) }
  }

  const fmt = (n) => `€${Number(n||0).toLocaleString('es-ES', {minimumFractionDigits:0, maximumFractionDigits:0})}`

  // Normalize field names — backend may return income/expenses or total_income/total_expenses
  const norm = (r) => ({
    ...r,
    total_income:    r.total_income    ?? r.income   ?? 0,
    total_expenses:  r.total_expenses  ?? r.expenses ?? 0,
    net:             r.net             ?? ((r.income ?? 0) - (r.expenses ?? 0)),
    net_margin_pct:  r.net_margin_pct  ?? (r.income > 0 ? ((r.income - r.expenses) / r.income * 100) : 0),
    withdrawable:    r.withdrawable    ?? Math.max(0, ((r.income ?? 0) - (r.expenses ?? 0)) * 0.4),
    ai_summary:      r.ai_summary      ?? r.content  ?? '',
  })

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <div className="eyebrow" style={{ marginBottom:8 }}>Reportes</div>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300 }}>Reportes Mensuales</h1>
      </div>

      {/* Generar reporte */}
      <div className="card" style={{ marginBottom:24, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <div style={{ fontSize:13, color:'var(--text-dim)', flex:1 }}>
          Genera el reporte del mes con resumen en lenguaje claro y recomendación de acción.
        </div>
        <select className="input" style={{ width:'auto' }} value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
          {MONTHS_FULL.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="input" style={{ width:'auto' }} value={genYear} onChange={e => setGenYear(Number(e.target.value))}>
          {[today.getFullYear(), today.getFullYear()-1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn btn-primary" onClick={generate} disabled={generating}>
          {generating ? 'Generando con IA…' : '◎ Generar reporte'}
        </button>
        <button onClick={deleteAll} disabled={deleting} style={{
          background:'rgba(220,50,50,0.15)', border:'1px solid rgba(220,50,50,0.4)',
          color:'var(--red-light,#f87171)', borderRadius:3, padding:'8px 16px',
          cursor:'pointer', fontSize:13, fontFamily:'inherit'
        }}>
          {deleting ? 'Borrando…' : '🗑 Borrar todo'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '280px 1fr' : '1fr', gap:16, alignItems:'start' }}>
        {/* Lista */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {loading ? (
            <div style={{ color:'var(--text-muted)', fontSize:13 }}>Cargando…</div>
          ) : reports.length === 0 ? (
            <div className="card" style={{ color:'var(--text-muted)', fontSize:13 }}>
              Sin reportes. Genera el primero arriba.
            </div>
          ) : reports.map(r => {
            const n = norm(r)
            return (
            <div key={r.id}
              onClick={() => setSelected(selected?.id===r.id ? null : n)}
              className="card"
              style={{ cursor:'pointer', borderColor: selected?.id===r.id ? 'var(--gold)' : 'var(--border)', transition:'all 0.2s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:20, fontWeight:300, color:'var(--cream)' }}>
                    {MONTHS_FULL[r.month-1]} {r.year}
                  </div>
                  <div style={{ display:'flex', gap:16, marginTop:8 }}>
                    <span style={{ fontSize:12, color:'var(--green)' }}>↑ {fmt(n.total_income)}</span>
                    <span style={{ fontSize:12, color:'var(--red-light)' }}>↓ {fmt(n.total_expenses)}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Margen</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:22, color: n.net_margin_pct>=0 ? 'var(--gold)':'var(--red-light)' }}>
                    {Number(n.net_margin_pct).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>

        {/* Detalle */}
        {selected && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:300 }}>
                  {MONTHS_FULL[selected.month-1]} {selected.year}
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18 }}>✕</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                {[['Ingresos', fmt(selected.total_income), 'var(--green)'],
                  ['Gastos', fmt(selected.total_expenses), 'var(--red-light)'],
                  ['Neto', fmt(selected.net), selected.net>=0?'var(--gold)':'var(--red-light)']].map(([l,v,c]) => (
                  <div key={l} style={{ background:'rgba(0,0,0,0.15)', borderRadius:3, padding:'14px' }}>
                    <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>{l}</div>
                    <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, fontWeight:300, color:c }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:3, padding:'14px 18px', marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>Puedes retirar</div>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'var(--green)' }}>{fmt(selected.withdrawable)}</div>
              </div>

              {selected.ai_summary && (
                <div>
                  <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:12 }}>
                    ◎ Análisis del mes
                  </div>
                  <div style={{ fontSize:17, color:'rgba(250,248,242,0.75)', lineHeight:1.8, fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontWeight:300 }}>
                    {selected.ai_summary}
                  </div>
                </div>
              )}
            </div>

            {selected.expense_breakdown && Object.keys(selected.expense_breakdown).length > 0 && (
              <div className="card">
                <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:16 }}>Desglose de gastos</div>
                {Object.entries(selected.expense_breakdown).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-sub)' }}>
                    <span style={{ fontSize:13, color:'var(--text-dim)' }}>{k}</span>
                    <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:17, color:'var(--red-light)' }}>{fmt(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
