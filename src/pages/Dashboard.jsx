import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function KPI({ label, value, sub, color, prefix='€' }) {
  return (
    <div className="card" style={{ flex:1 }}>
      <div style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:12 }}>{label}</div>
      <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:36, fontWeight:300, color: color || 'var(--cream)', lineHeight:1 }}>
        {prefix}{typeof value==='number' ? value.toLocaleString('es-ES', {minimumFractionDigits:0, maximumFractionDigits:0}) : '—'}
      </div>
      {sub && <div style={{ fontSize:12, marginTop:8, color:'var(--text-dim)' }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard({ company }) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year,  setYear]  = useState(today.getFullYear())
  const [data,  setData]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getDashboard(month, year)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [month, year])

  const s = data?.summary || {}

  // Datos para el gráfico de breakdown de gastos
  const expenseChart = data ? Object.entries(data.expense_breakdown || {})
    .sort((a,b) => b[1]-a[1]).slice(0,6)
    .map(([name, value]) => ({ name, value })) : []

  const incomeChart = data ? Object.entries(data.income_breakdown || {})
    .sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([name, value]) => ({ name, value })) : []

  const fmt = (n) => n != null ? `€${Number(n).toLocaleString('es-ES', {minimumFractionDigits:0, maximumFractionDigits:0})}` : '—'

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom:8 }}>Dashboard</div>
          <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:32, fontWeight:300, color:'var(--cream)' }}>
            {MONTHS_FULL[month-1]} {year}
          </h1>
        </div>
        {/* Selector de mes */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className="btn btn-ghost" style={{ padding:'8px 12px' }}
            onClick={() => { if(month===1){setMonth(12);setYear(y=>y-1)}else setMonth(m=>m-1) }}>←</button>
          <span style={{ fontSize:13, color:'var(--text-dim)', minWidth:80, textAlign:'center' }}>
            {MONTHS[month-1]} {year}
          </span>
          <button className="btn btn-ghost" style={{ padding:'8px 12px' }}
            onClick={() => { if(month===12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+1) }}>→</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color:'var(--text-dim)', fontSize:14, padding:40, textAlign:'center' }}>Cargando datos…</div>
      ) : (
        <>
          {/* KPIs principales */}
          <div style={{ display:'flex', gap:16, marginBottom:24 }}>
            <KPI label="Ingresos" value={s.total_income} color="var(--green)"
              sub={s.income_vs_prev != null ? `${s.income_vs_prev > 0 ? '+':''}${s.income_vs_prev?.toFixed(1)}% vs mes anterior` : undefined} />
            <KPI label="Gastos" value={s.total_expenses} color="var(--red-light)" />
            <KPI label="Resultado neto" value={s.net} color={s.net >= 0 ? 'var(--gold)' : 'var(--red-light)'}
              sub={`Margen: ${s.margin_pct?.toFixed(1)}%`} />
          </div>

          {/* Caja de retiro — la más importante */}
          <div style={{
            background: s.withdrawable > 0 ? 'rgba(74,222,128,0.07)' : 'rgba(204,53,32,0.07)',
            border: `1px solid ${s.withdrawable > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(204,53,32,0.2)'}`,
            borderRadius:4, padding:'20px 24px', marginBottom:24,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>
                {s.withdrawable > 0 ? '✓ Puedes retirar este mes' : '⚠ Mes en negativo'}
              </div>
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:40, fontWeight:300, color: s.withdrawable > 0 ? 'var(--green)' : 'var(--red-light)' }}>
                {fmt(s.withdrawable)}
              </div>
              <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:6 }}>
                40% del neto · Reserva el resto para IVA, SS y buffer
              </div>
            </div>
            {s.net > 0 && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Reserva operativa</div>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:24, color:'var(--text-dim)' }}>{fmt(s.net * 0.6)}</div>
              </div>
            )}
          </div>

          {/* Gráficos */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
            {/* Gastos por categoría */}
            <div className="card">
              <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:20 }}>
                Gastos por categoría
              </div>
              {expenseChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={expenseChart} layout="vertical" margin={{ left:0, right:16, top:0, bottom:0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill:'rgba(250,248,242,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`€${v.toLocaleString('es-ES')}`, '']} contentStyle={{ background:'#0a4a40', border:'1px solid var(--border)', borderRadius:3, color:'var(--cream)', fontSize:12 }} />
                    <Bar dataKey="value" radius={[0,2,2,0]}>
                      {expenseChart.map((_, i) => <Cell key={i} fill={`rgba(204,53,32,${0.9-i*0.12})`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color:'var(--text-muted)', fontSize:13, padding:'20px 0' }}>Sin gastos registrados</div>}
            </div>

            {/* Ingresos por categoría */}
            <div className="card">
              <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:20 }}>
                Ingresos por categoría
              </div>
              {incomeChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={incomeChart} layout="vertical" margin={{ left:0, right:16, top:0, bottom:0 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fill:'rgba(250,248,242,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`€${v.toLocaleString('es-ES')}`, '']} contentStyle={{ background:'#0a4a40', border:'1px solid var(--border)', borderRadius:3, color:'var(--cream)', fontSize:12 }} />
                    <Bar dataKey="value" radius={[0,2,2,0]}>
                      {incomeChart.map((_, i) => <Cell key={i} fill={`rgba(74,222,128,${0.9-i*0.15})`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color:'var(--text-muted)', fontSize:13, padding:'20px 0' }}>Sin ingresos registrados</div>}
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="card">
            <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:20 }}>
              Últimos movimientos
            </div>
            {(data?.recent_transactions || []).length === 0 ? (
              <div style={{ color:'var(--text-muted)', fontSize:13 }}>Sin movimientos registrados este mes.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                {data.recent_transactions.map((tx, i) => (
                  <div key={tx.id} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 0', borderBottom: i < data.recent_transactions.length-1 ? '1px solid var(--border-sub)' : 'none',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                        background: tx.type==='income' ? 'var(--green)' : 'var(--red-light)' }} />
                      <div>
                        <div style={{ fontSize:13, color:'var(--cream)' }}>{tx.description || tx.vendor_client || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                          {tx.transaction_date} · {tx.category || 'Sin categoría'} · {tx.source==='manual' ? 'Manual' : 'Documento'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18, fontWeight:300,
                      color: tx.type==='income' ? 'var(--green)' : 'var(--red-light)' }}>
                      {tx.type==='income' ? '+' : '-'}€{Number(tx.amount).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
