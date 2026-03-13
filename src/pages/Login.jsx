import { useState } from 'react'
import { api } from '../api.js'

const SECTORS = [
  { value: 'restaurant', label: 'Restaurante / Bar / Cafetería' },
  { value: 'agency',     label: 'Agencia creativa / Marketing' },
  { value: 'freelance',  label: 'Freelance / Autónomo' },
  { value: 'default',    label: 'Otro tipo de negocio' },
]

export default function Login({ onLogin }) {
  const [mode, setMode]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ email:'', password:'', full_name:'', company_name:'', sector:'restaurant', nif:'' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await (mode === 'login' ? api.login : api.register)(form)
      onLogin(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      background:'radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.05) 0%, transparent 60%), var(--teal)' }}>
      <div style={{ width:'100%', maxWidth:420 }} className="fade-up">
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:13, letterSpacing:'0.4em', color:'var(--gold)', textTransform:'uppercase', marginBottom:6 }}>MATSEBIAN</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.2em', textTransform:'uppercase' }}>Business Management</div>
        </div>
        <div className="card" style={{ padding:36 }}>
          <div style={{ display:'flex', marginBottom:32, borderBottom:'1px solid var(--border-sub)' }}>
            {[['login','Entrar'],['register','Crear cuenta']].map(([m,label]) => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex:1, padding:'10px 0', border:'none', background:'transparent',
                fontFamily:'Jost, sans-serif', fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase',
                cursor:'pointer', color: mode===m ? 'var(--gold)':'var(--text-muted)',
                borderBottom: mode===m ? '1px solid var(--gold)':'1px solid transparent', marginBottom:-1, transition:'all 0.2s',
              }}>{label}</button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {mode === 'register' && (<>
              <div className="form-group"><label className="form-label">Nombre completo</label>
                <input className="input" type="text" placeholder="Tu nombre" value={form.full_name} onChange={set('full_name')} required /></div>
              <div className="form-group"><label className="form-label">Nombre de la empresa</label>
                <input className="input" type="text" placeholder="Las Adelitas, Agencia XYZ..." value={form.company_name} onChange={set('company_name')} required /></div>
              <div className="form-group"><label className="form-label">Tipo de negocio</label>
                <select className="input" value={form.sector} onChange={set('sector')}>
                  {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">NIF / CIF (opcional)</label>
                <input className="input" type="text" placeholder="B12345678" value={form.nif} onChange={set('nif')} /></div>
            </>)}
            <div className="form-group"><label className="form-label">Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} required /></div>
            <div className="form-group"><label className="form-label">Contraseña</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required /></div>
            {error && <div style={{ background:'rgba(204,53,32,0.1)', border:'1px solid rgba(204,53,32,0.3)', borderRadius:3, padding:'10px 14px', color:'var(--red-light)', fontSize:13 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', marginTop:8 }}>
              {loading ? 'Un momento…' : mode==='login' ? 'Entrar →' : 'Crear cuenta →'}
            </button>
          </form>
          {mode==='register' && <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:16 }}>30 días de prueba gratuita · Sin tarjeta</p>}
        </div>
      </div>
    </div>
  )
}
