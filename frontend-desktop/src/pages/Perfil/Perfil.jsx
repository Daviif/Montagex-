import React, { useMemo, useState } from 'react'
import Card from '../../components/Card/Card'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import './Perfil.css'

const Perfil = () => {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    chave_pix: user?.chave_pix || '',
    data_nascimento: user?.data_nascimento || '',
    habilitacao: user?.habilitacao || '',
    meta_mensal: user?.meta_mensal ?? ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const avatarUrl = useMemo(() => {
    if (!user?.foto_perfil) return null
    if (user.foto_perfil.startsWith('http')) return user.foto_perfil

    const apiBase = api.defaults.baseURL || '/api'
    const baseWithoutApi = apiBase.replace(/\/api\/?$/, '')
    return `${baseWithoutApi}${user.foto_perfil}`
  }, [user])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      setIsSaving(true)
      const payload = {
        chave_pix: form.chave_pix || null,
        data_nascimento: form.data_nascimento || null,
        habilitacao: form.habilitacao || null,
        meta_mensal: form.meta_mensal === '' ? null : Number(form.meta_mensal)
      }

      const response = await api.put('/perfil', payload)
      const nextUser = response.data?.usuario || {}
      updateUser(nextUser)
      setMessage('Perfil atualizado com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível salvar o perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadFoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setMessage('')

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('foto', file)

      const response = await api.post('/perfil/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const nextUser = response.data?.usuario || {}
      updateUser(nextUser)
      setMessage('Foto de perfil atualizada com sucesso.')
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível enviar a foto.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="perfil">
      <div className="perfil__header">
        <h1 className="perfil__title">Perfil</h1>
        <p className="perfil__subtitle">Dados pessoais e metas do montador</p>
      </div>

      <Card title="Minha Conta" className="perfil__card">
        <div className="perfil__avatar-section">
          <div className="perfil__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Foto de perfil" className="perfil__avatar-image" />
            ) : (
              <span>{user?.nome?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>

          <label className="perfil__upload-button">
            {isUploading ? 'Enviando foto...' : 'Alterar foto'}
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadFoto}
              disabled={isUploading}
              hidden
            />
          </label>
        </div>

        <form className="perfil__form" onSubmit={handleSubmit}>
          <label className="perfil__label">
            Chave PIX
            <input
              type="text"
              className="perfil__input"
              value={form.chave_pix}
              onChange={(event) => setForm((prev) => ({ ...prev, chave_pix: event.target.value }))}
              placeholder="Opcional"
            />
          </label>

          <label className="perfil__label">
            Data de nascimento
            <input
              type="date"
              className="perfil__input"
              value={form.data_nascimento}
              onChange={(event) => setForm((prev) => ({ ...prev, data_nascimento: event.target.value }))}
            />
          </label>

          <label className="perfil__label">
            Habilitação
            <input
              type="text"
              className="perfil__input"
              value={form.habilitacao}
              onChange={(event) => setForm((prev) => ({ ...prev, habilitacao: event.target.value }))}
              placeholder="Ex: AB"
            />
          </label>

          <label className="perfil__label">
            Meta mensal (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              className="perfil__input"
              value={form.meta_mensal}
              onChange={(event) => setForm((prev) => ({ ...prev, meta_mensal: event.target.value }))}
              placeholder="Opcional"
            />
          </label>

          {error && <div className="perfil__feedback perfil__feedback--error">{error}</div>}
          {message && <div className="perfil__feedback perfil__feedback--success">{message}</div>}

          <div className="perfil__actions">
            <button type="submit" className="perfil__button" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default Perfil
