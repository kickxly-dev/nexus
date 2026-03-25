import { useState, useRef, useEffect, useCallback } from 'react'
import { useWorkspaceStore, WORKSPACE_COLORS } from '../store/workspaceStore'

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function WorkspaceManager({ onClose }) {
  const { workspaces, activeId, createWorkspace, deleteWorkspace, renameWorkspace, setActive, updateNotes } =
    useWorkspaceStore()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [selectedId, setSelectedId] = useState(activeId)
  const editInputRef = useRef(null)
  const notesTimerRef = useRef(null)

  // Focus inline edit input when it appears
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    createWorkspace(trimmed, newColor)
    setNewName('')
    setNewColor(WORKSPACE_COLORS[workspaces.length % WORKSPACE_COLORS.length])
  }

  const handleKeyCreate = e => {
    if (e.key === 'Enter') handleCreate()
  }

  const startEdit = (id, name) => {
    setEditingId(id)
    setEditingName(name)
  }

  const commitEdit = () => {
    if (editingId) renameWorkspace(editingId, editingName)
    setEditingId(null)
    setEditingName('')
  }

  const handleEditKey = e => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
  }

  const handleSelectWorkspace = id => {
    setActive(id)
    setSelectedId(id)
    onClose()
  }

  const handleNotesChange = useCallback((id, value) => {
    clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => updateNotes(id, value), 400)
  }, [updateNotes])

  const selectedWorkspace = workspaces.find(w => w.id === selectedId) ?? null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9996,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-2xl)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Workspaces
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', padding: '4px 6px',
              borderRadius: 'var(--r-md)', lineHeight: 1, fontSize: 16,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Create new workspace */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--text-5)',
              marginBottom: 8,
            }}>New Workspace</p>

            {/* Color picker */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {WORKSPACE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  title={c}
                  style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: c, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                    outline: newColor === c ? `2px solid ${c}` : '2px solid transparent',
                    outlineOffset: 2,
                    transition: 'outline 0.1s',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={handleKeyCreate}
                placeholder="Workspace name…"
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text-1)',
                  fontSize: 12,
                  padding: '7px 10px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.12s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                style={{
                  background: newName.trim() ? 'var(--accent-hi)' : 'var(--bg-raised)',
                  border: '1px solid transparent',
                  borderRadius: 'var(--r-md)',
                  color: newName.trim() ? 'white' : 'var(--text-4)',
                  fontSize: 12, fontWeight: 500,
                  padding: '7px 14px', cursor: newName.trim() ? 'pointer' : 'default',
                  transition: 'all 0.12s', whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                Create
              </button>
            </div>
          </div>

          {/* Workspace list */}
          <div style={{ marginBottom: selectedWorkspace ? 16 : 0 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--text-5)',
              marginBottom: 8,
            }}>Your Workspaces</p>

            {workspaces.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--text-4)',
                fontSize: 11,
                letterSpacing: '-0.01em',
                lineHeight: 1.6,
              }}>
                No workspaces yet · create one to organize your scans
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {workspaces.map(w => (
                  <div
                    key={w.id}
                    onClick={() => handleSelectWorkspace(w.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 11px',
                      borderRadius: 'var(--r-md)',
                      border: activeId === w.id
                        ? '1px solid var(--border-accent)'
                        : '1px solid var(--border)',
                      background: activeId === w.id ? 'var(--bg-active)' : 'var(--bg-raised)',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (activeId !== w.id) {
                        e.currentTarget.style.background = 'var(--bg-hover)'
                        e.currentTarget.style.borderColor = 'var(--border-strong)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeId !== w.id) {
                        e.currentTarget.style.background = 'var(--bg-raised)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }
                    }}
                  >
                    {/* Colored dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: w.color, flexShrink: 0,
                    }} />

                    {/* Name — inline edit on double-click */}
                    {editingId === w.id ? (
                      <input
                        ref={editInputRef}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={handleEditKey}
                        onBlur={commitEdit}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, background: 'var(--bg-input)',
                          border: '1px solid var(--border-accent)',
                          borderRadius: 4, color: 'var(--text-1)',
                          fontSize: 12, padding: '2px 6px',
                          outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={e => { e.stopPropagation(); startEdit(w.id, w.name) }}
                        style={{
                          flex: 1, fontSize: 12, fontWeight: 500,
                          color: 'var(--text-1)', userSelect: 'none',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                        title="Double-click to rename"
                      >
                        {w.name}
                      </span>
                    )}

                    {/* Created date */}
                    <span style={{
                      fontSize: 9, color: 'var(--text-4)',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: 0, flexShrink: 0,
                    }}>
                      {formatDate(w.createdAt)}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (selectedId === w.id) setSelectedId(null)
                        deleteWorkspace(w.id)
                      }}
                      title="Delete workspace"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-5)', fontSize: 14, lineHeight: 1,
                        padding: '2px 4px', borderRadius: 4, flexShrink: 0,
                        transition: 'color 0.12s',
                      }}
                      onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--red)' }}
                      onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--text-5)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes section — shown for selected workspace */}
          {selectedWorkspace && (
            <div>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--text-5)',
                marginBottom: 8,
              }}>
                Notes · {selectedWorkspace.name}
              </p>
              <textarea
                defaultValue={selectedWorkspace.notes}
                onChange={e => handleNotesChange(selectedWorkspace.id, e.target.value)}
                placeholder="Add notes about this workspace…"
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text-1)',
                  fontSize: 11,
                  padding: '8px 10px',
                  outline: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  resize: 'vertical',
                  lineHeight: 1.6,
                  transition: 'border-color 0.12s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
