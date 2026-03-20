import {useState} from 'react'
import type {Holiday} from '../../types'
import './HolidayManager.css'

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function fmtHoliday(iso: string): string {
    const d = new Date(iso + 'T00:00:00')
    return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

interface HolidayManagerProps {
    holidays: Holiday[]
    onAdd: (h: Holiday) => void
    onRemove: (date: string) => void
    sprintStart: string
    sprintEnd: string
}

export default function HolidayManager({
                                           holidays,
                                           onAdd,
                                           onRemove,
                                           sprintStart,
                                           sprintEnd,
                                       }: HolidayManagerProps) {
    const [open, setOpen] = useState(false)
    const [newDate, setNewDate] = useState('')
    const [newName, setNewName] = useState('')
    const [error, setError] = useState('')

    const handleAdd = (): void => {
        setError('')
        if (!newDate) {
            setError('Selecciona una fecha');
            return
        }
        const d = new Date(newDate + 'T00:00:00')
        const dow = d.getDay()
        if (dow === 0 || dow === 6) {
            setError('Los feriados solo aplican en días hábiles (Lun–Vie)')
            return
        }
        if (holidays.some((h) => h.date === newDate)) {
            setError('Esta fecha ya está registrada')
            return
        }
        onAdd({date: newDate, name: newName.trim() || 'Feriado'})
        setNewDate('')
        setNewName('')
    }

    return (
        <>
            <button className="btn-holidays" onClick={() => setOpen(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Feriados {holidays.length > 0 && <span className="hol-count">{holidays.length}</span>}
            </button>

            {open && (
                <div
                    className="hol-overlay"
                    onClick={(e) => e.target === e.currentTarget && setOpen(false)}
                >
                    <div className="hol-panel">
                        <div className="hol-header">
                            <div>
                                <div className="hol-title">Feriados del sprint</div>
                                <div className="hol-sub">Se excluyen del calendario hábil y desplazan las HUs</div>
                            </div>
                            <button className="hol-close" onClick={() => setOpen(false)}>✕</button>
                        </div>

                        {/* Add form */}
                        <div className="hol-form">
                            <div className="hol-form-row">
                                <div className="hol-field">
                                    <label className="hol-label">Fecha</label>
                                    <input
                                        type="date"
                                        className="hol-date-input"
                                        value={newDate}
                                        min={sprintStart}
                                        max={sprintEnd}
                                        onChange={(e) => {
                                            setNewDate(e.target.value);
                                            setError('')
                                        }}
                                    />
                                </div>
                                <div className="hol-field hol-field-name">
                                    <label className="hol-label">Nombre (opcional)</label>
                                    <input
                                        type="text"
                                        className="hol-text-input"
                                        value={newName}
                                        placeholder="Ej: Año Nuevo"
                                        maxLength={40}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                </div>
                                <button className="hol-add-btn" onClick={handleAdd}>Agregar</button>
                            </div>
                            {error && <div className="hol-error">⚠ {error}</div>}
                        </div>

                        {/* List */}
                        <div className="hol-list">
                            {holidays.length === 0 ? (
                                <div className="hol-empty">No hay feriados registrados</div>
                            ) : (
                                [...holidays]
                                    .sort((a, b) => a.date.localeCompare(b.date))
                                    .map((h) => (
                                        <div key={h.date} className="hol-item">
                                            <div className="hol-item-dot"/>
                                            <div className="hol-item-info">
                                                <span className="hol-item-name">{h.name}</span>
                                                <span className="hol-item-date">{fmtHoliday(h.date)}</span>
                                            </div>
                                            <button
                                                className="hol-remove"
                                                onClick={() => onRemove(h.date)}
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                            )}
                        </div>

                        <div className="hol-footer-note">
                            Los feriados se guardan en el navegador y persisten entre sesiones.
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
