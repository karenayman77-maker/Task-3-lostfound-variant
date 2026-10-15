import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }
const statuses = ['lost', 'found', 'claimed']
const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other']

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let isCurrent = true
    setError('')
    setLoadFailed(false)

    if (!id) {
      setForm(defaults)
      setIsLoading(false)
      return () => { isCurrent = false }
    }

    setIsLoading(true)
    api.get(`/items/${id}`)
      .then(({ data }) => {
        if (!isCurrent) return
        const item = data.item
        setForm({
          title: item.title ?? '',
          status: item.status ?? defaults.status,
          category: item.category ?? defaults.category,
          location: item.location ?? '',
          description: item.description ?? ''
        })
      })
      .catch(err => {
        if (!isCurrent) return
        setLoadFailed(true)
        setError(err?.response?.data?.message || 'Unable to load item')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => { isCurrent = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(current => ({ ...current, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const item = {
      title: form.title,
      status: form.status,
      category: form.category,
      location: form.location,
      description: form.description
    }

    try {
      if (id) {
        await api.patch(`/items/${id}`, item)
      } else {
        await api.post('/items', item)
      }
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      {error && <div className="text-red-600 text-sm mb-3" role="alert">{error}</div>}
      {isLoading ? (
        <p className="text-sm text-zinc-600">Loading item…</p>
      ) : !loadFailed && (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Title</span>
            <input
              className="input"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Black backpack"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Status</span>
            <select className="input" name="status" value={form.status} onChange={onChange}>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Category</span>
            <select className="input" name="category" value={form.category} onChange={onChange}>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Location (optional)</span>
            <input
              className="input"
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="Library 2nd floor"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea
              className="input"
              name="description"
              value={form.description}
              onChange={onChange}
              rows="4"
            />
          </label>

          <button className="btn" type="submit">Save</button>
        </form>
      )}
    </div>
  )
}
