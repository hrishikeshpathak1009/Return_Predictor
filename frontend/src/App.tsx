import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, BrainCircuit, CheckCircle2, CircleAlert, Gauge, LoaderCircle, PackageCheck, RefreshCw, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

type Metric = { name: string; value: number }
type Feature = { feature: string; importance: number }
type ModelInfo = { model_name: string; metrics: Metric[]; feature_importance: Feature[]; threshold: number }
type Prediction = { return_probability: number; predicted_returned: boolean; risk_level: 'Low' | 'Medium' | 'High' }

const initialForm = {
  product_category: 'Electronics',
  sub_category: 'Laptops',
  brand: 'Brand_21',
  product_price: '1581.93',
  discount_percent: '30',
  product_rating: '4.0',
  review_count: '70',
  fragile_item: '0',
  warranty_available: '1',
  product_return_rate: '0.13',
  category_return_rate: '0.12',
  brand_return_rate: '0.13',
  defect_rate: '0.06',
  seller_rating: '4.1',
  seller_return_rate: '0.12',
  fulfillment_type: 'Marketplace Fulfilled',
  payment_method: 'UPI',
  quantity: '1',
  shipping_distance_km: '500',
  delayed_delivery: '0',
  wishlist_before_purchase: '0',
  product_page_views: '12',
  customer_support_calls: '0',
  chat_interactions: '0',
}

const fieldGroups = [
  { title: 'Product details', description: 'What is being purchased?', fields: [
    ['product_category', 'Product category', 'text'], ['sub_category', 'Sub-category', 'text'], ['brand', 'Brand', 'text'],
    ['product_price', 'Product price', 'number'], ['discount_percent', 'Discount (%)', 'number'], ['product_rating', 'Product rating (0–5)', 'number'], ['review_count', 'Review count', 'number'],
  ]},
  { title: 'Product & seller signals', description: 'Quality, warranty and historical return rates', fields: [
    ['fragile_item', 'Fragile item', 'boolean'], ['warranty_available', 'Warranty available', 'boolean'], ['product_return_rate', 'Product return rate (0–1)', 'number'],
    ['category_return_rate', 'Category return rate (0–1)', 'number'], ['brand_return_rate', 'Brand return rate (0–1)', 'number'], ['defect_rate', 'Defect rate (0–1)', 'number'],
    ['seller_rating', 'Seller rating (0–5)', 'number'], ['seller_return_rate', 'Seller return rate (0–1)', 'number'],
  ]},
  { title: 'Order & delivery', description: 'Fulfillment, payment and delivery context', fields: [
    ['fulfillment_type', 'Fulfillment type', 'fulfillment'], ['payment_method', 'Payment method', 'payment'], ['quantity', 'Quantity', 'number'],
    ['shipping_distance_km', 'Shipping distance (km)', 'number'], ['delayed_delivery', 'Delayed delivery', 'boolean'], ['wishlist_before_purchase', 'Wishlisted before purchase', 'boolean'],
    ['product_page_views', 'Product page views', 'number'], ['customer_support_calls', 'Customer support calls', 'number'], ['chat_interactions', 'Chat interactions', 'number'],
  ]},
] as const

function toPayload(form: typeof initialForm) {
  const nullable = new Set(['product_rating', 'review_count', 'seller_rating', 'shipping_distance_km'])
  const integer = new Set(['fragile_item', 'warranty_available', 'quantity', 'delayed_delivery', 'wishlist_before_purchase', 'product_page_views', 'customer_support_calls', 'chat_interactions'])
  const categorical = new Set(['product_category', 'sub_category', 'brand', 'fulfillment_type', 'payment_method'])
  const payload: Record<string, string | number | null> = {}
  for (const [key, raw] of Object.entries(form)) {
    if (categorical.has(key)) payload[key] = raw.trim()
    else if (raw.trim() === '' && nullable.has(key)) payload[key] = null
    else payload[key] = integer.has(key) ? Number.parseInt(raw, 10) : Number(raw)
  }
  return payload
}

function prettyMetric(name: string) {
  const labels: Record<string, string> = { Accuracy: 'Accuracy', Precision: 'Precision', Recall: 'Recall', F1: 'F1 score' }
  return labels[name] || name.replaceAll('_', ' ')
}

export default function App() {
  const [form, setForm] = useState(initialForm)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [error, setError] = useState('')
  const [health, setHealth] = useState<'checking' | 'online' | 'offline'>('checking')

  async function loadInfo() {
    setLoadingInfo(true)
    try {
      const [h, info] = await Promise.all([fetch(`${API}/health`), fetch(`${API}/model-info`)])
      if (!h.ok || !info.ok) throw new Error('Backend is reachable, but the model is not ready.')
      setHealth('online')
      setModelInfo(await info.json())
      setError('')
    } catch (e) {
      setHealth('offline')
      setError(e instanceof Error ? e.message : 'Could not connect to the API.')
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => { void loadInfo() }, [])

  const metrics = useMemo(() => modelInfo?.metrics ?? [], [modelInfo])
  const topFeatures = useMemo(() => (modelInfo?.feature_importance ?? []).slice(0, 8), [modelInfo])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setPrediction(null)
    try {
      const response = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form)),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail || 'Prediction failed. Check the input values and API logs.')
      setPrediction(body)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Prediction request failed.')
    } finally {
      setLoading(false)
    }
  }

  function update(key: keyof typeof initialForm, value: string) {
    setForm(old => ({ ...old, [key]: value }))
  }

  const probability = prediction ? Math.round(prediction.return_probability * 100) : 0

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><BrainCircuit size={22}/></div><div><strong>ReturnIQ</strong><span>RETURN INTELLIGENCE</span></div></div>
        <div className="side-label">WORKSPACE</div>
        <a className="nav-item active"><Gauge size={17}/> Overview <span className="nav-dot"/></a>
        <a className="nav-item"><Activity size={17}/> Prediction studio</a>
        <div className="side-bottom"><div className="side-model-icon"><ShieldCheck size={18}/></div><div><strong>Model workspace</strong><span>Local inference API</span></div><span className={`status-dot ${health}`}/></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><div className="eyebrow">MACHINE LEARNING / CLASSIFICATION</div><h1>Product return intelligence</h1><p>Estimate return likelihood from product, seller and order signals.</p></div>
          <div className={`connection ${health}`}><span className={`status-dot ${health}`}/>{health === 'online' ? 'API connected' : health === 'checking' ? 'Connecting…' : 'API unavailable'}<button className="icon-button" onClick={() => void loadInfo()} aria-label="Refresh API status"><RefreshCw size={15}/></button></div>
        </header>

        <section className="hero-card">
          <div className="hero-copy"><div className="hero-pill"><Sparkles size={13}/> PREDICTION WORKSPACE</div><h2>Make every order<br/><em>more informed.</em></h2><p>Use your trained classifier to estimate return probability and surface the signals behind your model.</p><div className="hero-foot"><span><CheckCircle2 size={15}/> Trained model artifact</span><span><CheckCircle2 size={15}/> Live API inference</span></div></div>
          <div className="hero-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orb-center"><BrainCircuit size={35}/></div><div className="float-chip chip-top"><TrendingUp size={15}/> ML insights</div><div className="float-chip chip-bottom"><PackageCheck size={15}/> Order signals</div></div>
        </section>

        {error && <div className="alert"><CircleAlert size={18}/><div><strong>{health === 'offline' ? 'Connection issue' : 'Something needs attention'}</strong><span>{error}</span></div></div>}

        <section className="metric-grid">
          <div className="metric-card"><div className="metric-label">Selected model</div><div className="metric-main model-name">{loadingInfo ? 'Loading…' : modelInfo?.model_name ?? 'Unavailable'}</div><div className="metric-note"><BrainCircuit size={14}/> Loaded from joblib artifact</div></div>
          {['Accuracy', 'Precision', 'Recall', 'F1'].map(name => {
            const m = metrics.find(x => x.name.toLowerCase() === name.toLowerCase())
            return <div className="metric-card" key={name}><div className="metric-label">{prettyMetric(name)}</div><div className="metric-main">{m ? `${(m.value * 100).toFixed(1)}%` : '—'}</div><div className="metric-note"><span className="metric-bar"><i style={{ width: `${Math.max(0, Math.min(100, (m?.value ?? 0) * 100))}%` }}/></span>Saved evaluation metric</div></div>
          })}
        </section>

        <div className="section-heading"><div><div className="eyebrow">INFERENCE</div><h2>Analyze an order</h2><p>Enter the raw features expected by the trained model.</p></div><span className="field-count">24 INPUT FIELDS</span></div>
        <div className="workspace-grid">
          <form className="form-card" onSubmit={submit}>
            {fieldGroups.map(group => <section className="field-group" key={group.title}><div className="group-heading"><div><h3>{group.title}</h3><p>{group.description}</p></div></div><div className="fields-grid">{group.fields.map(([key, label, kind]) => <label className="field" key={key}><span>{label}</span>{kind === 'boolean' ? <select value={form[key]} onChange={e => update(key, e.target.value)}><option value="0">No / False</option><option value="1">Yes / True</option></select> : kind === 'fulfillment' ? <select value={form[key]} onChange={e => update(key, e.target.value)}><option>Marketplace Fulfilled</option><option>Seller Fulfilled</option></select> : kind === 'payment' ? <select value={form[key]} onChange={e => update(key, e.target.value)}><option>UPI</option><option>Credit Card</option><option>Debit Card</option><option>Cash on Delivery</option><option>Net Banking</option><option>Wallet</option></select> : <input type={kind === 'number' ? 'number' : 'text'} value={form[key]} onChange={e => update(key, e.target.value)} required={!['product_rating','review_count','seller_rating','shipping_distance_km'].includes(key)} step={kind === 'number' ? 'any' : undefined} min={kind === 'number' ? '0' : undefined} placeholder={kind === 'text' ? `Enter ${label.toLowerCase()}` : 'Enter value'}/>}</label>)}</div></section>)}
            <div className="form-actions"><button className="secondary-button" type="button" onClick={() => { setForm(initialForm); setPrediction(null); setError('') }}>Reset form</button><button className="primary-button" disabled={loading || health !== 'online'} type="submit">{loading ? <><LoaderCircle className="spin" size={17}/> Predicting…</> : <><Sparkles size={17}/> Predict return risk</>}</button></div>
          </form>

          <aside className="right-column">
            <section className="result-card"><div className="card-topline"><span className="result-icon"><Activity size={17}/></span><span className="live-tag">LIVE INFERENCE</span></div><h3>Prediction result</h3><p className="muted">Your result will appear here after the API responds.</p>{prediction ? <><div className="probability-block"><div className="probability-number">{probability}<span>%</span></div><div className="probability-label">Estimated return probability</div><div className="progress-track"><div className={`progress-fill ${prediction.risk_level.toLowerCase()}`} style={{ width: `${probability}%` }}/></div></div><div className={`risk-banner ${prediction.risk_level.toLowerCase()}`}><div><span className="risk-caption">RISK LEVEL</span><strong>{prediction.risk_level} risk</strong></div><span className="risk-badge">{prediction.predicted_returned ? 'Predicted return' : 'Predicted no return'}</span></div><div className="result-footnote"><CircleAlert size={14}/> Model estimate, not a guarantee. Risk bands are configured separately from the classification threshold.</div></> : <div className="empty-result"><div className="empty-icon"><Activity size={25}/></div><strong>Awaiting an order</strong><span>Complete the form and run a prediction to see the model output.</span></div>}</section>

            <section className="insights-card"><div className="insights-heading"><div><div className="eyebrow">MODEL EXPLORER</div><h3>Top feature signals</h3></div><TrendingUp size={18}/></div><p className="muted">Stored feature importance from the trained artifact.</p>{topFeatures.length ? <div className="feature-list">{topFeatures.map((f, i) => { const max = Math.max(...topFeatures.map(x => Math.abs(x.importance)), 0.000001); return <div className="feature-row" key={f.feature}><div className="feature-meta"><span className="feature-rank">{String(i + 1).padStart(2, '0')}</span><span className="feature-name">{f.feature.replaceAll('_', ' ')}</span><strong>{f.importance.toFixed(3)}</strong></div><div className="feature-track"><i style={{ width: `${Math.abs(f.importance) / max * 100}%` }}/></div></div>})}</div> : <div className="feature-empty">{loadingInfo ? 'Loading model insights…' : 'No feature-importance data available.'}</div>}</section>
            <div className="disclaimer"><ShieldCheck size={17}/><span><strong>Decision support, not certainty.</strong> Confirm the model’s performance and feature availability before using predictions in a live business workflow.</span></div>
          </aside>
        </div>
        <footer className="footer"><span>ReturnIQ · Product Return Prediction</span><span>Built with React + FastAPI + scikit-learn</span></footer>
      </main>
    </div>
  )
}
