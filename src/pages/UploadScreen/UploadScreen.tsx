import {useState, useRef, useCallback} from 'react'
import {getDefaultSprintDates} from '../../utils/sprint'
import type {Holiday} from '../../types'
import './UploadScreen.css'

const SAMPLE_CSV = `P;HU;Dev1;Dev2;Dev3;QA1;QA2;TL
2;Historia 1;5;3;3;8;;2
1;Historia 2;2;4;5;;8;1
3;Historia 3;1;1;;;;1
1;Historia 4;;2;;4;3;
2;Historia 5;3;;;;5;2`

// Used to validate default dates are available
void getDefaultSprintDates

interface UploadScreenProps {
    onParse: (text: string) => void
    error: string | null
    sprintStart: string
    sprintEnd: string
    onDatesChange: (start: string, end: string) => void
    holidays: Holiday[]
    onAddHoliday: (h: Holiday) => void
    onRemoveHoliday: (date: string) => void
}

export default function UploadScreen({
                                         onParse,
                                         error,
                                         sprintStart,
                                         sprintEnd,
                                         onDatesChange,
                                     }: UploadScreenProps) {
    const [csvText, setCsvText] = useState('')
    const [dragging, setDragging] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback(
        (file: File | undefined | null): void => {
            if (!file) return
            const reader = new FileReader()
            reader.onload = (e) => {
                const text = e.target?.result as string
                setCsvText(text)
                onParse(text)
            }
            reader.readAsText(file)
        },
        [onParse],
    )

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>): void => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
        },
        [handleFile],
    )

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setDragging(true)
    }
    const handleDragLeave = (): void => setDragging(false)

    const countWorkingDays = (): number => {
        if (!sprintStart || !sprintEnd) return 0
        const start = new Date(sprintStart + 'T00:00:00')
        const end = new Date(sprintEnd + 'T00:00:00')
        const all: number[] = []
        const cur = new Date(start)
        while (cur <= end) {
            if (cur.getDay() !== 0 && cur.getDay() !== 6) all.push(1)
            cur.setDate(cur.getDate() + 1)
        }
        return Math.max(0, all.length - 2)
    }

    const workingDays = countWorkingDays()

    return (
        <div className="upload-screen">
            <div className="upload-hero">
                <div className="upload-badge">CSV → GANTT</div>
                <h2 className="upload-headline">Carga tu planificación de sprint</h2>
                <p className="upload-desc">
                    Define las fechas, pega el contenido CSV o arrastra un archivo. Columnas dinámicas — Dev, QA, TL, o
                    cualquier rol.
                </p>
            </div>

            {/* Sprint dates row */}
            <div className="dates-section">
                <div className="dates-card">
                    <div className="card-header">
                        <span className="card-tag">01</span>
                        <span className="card-title">Fechas del sprint</span>
                        {workingDays > 0 && (
                            <span className="days-badge">{workingDays} días hábiles disponibles</span>
                        )}
                    </div>
                    <div className="dates-row">
                        <div className="date-field">
                            <label className="field-label">Inicio del sprint</label>
                            <input
                                type="date"
                                className="date-input-up"
                                value={sprintStart}
                                onChange={(e) => onDatesChange(e.target.value, sprintEnd)}
                            />
                        </div>
                        <div className="date-sep">→</div>
                        <div className="date-field">
                            <label className="field-label">Fin del sprint</label>
                            <input
                                type="date"
                                className="date-input-up"
                                value={sprintEnd}
                                min={sprintStart}
                                onChange={(e) => onDatesChange(sprintStart, e.target.value)}
                            />
                        </div>
                        <div className="date-info">
                            <div className="info-rule">
                                <span className="info-dot blocked"/>
                                <span>Primer y último día hábil bloqueados</span>
                            </div>
                            <div className="info-rule">
                                <span className="info-dot weekend"/>
                                <span>Fines de semana excluidos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="upload-grid">
                {/* Paste area */}
                <div className="upload-card paste-card">
                    <div className="card-header">
                        <span className="card-tag">02</span>
                        <span className="card-title">Pegar CSV</span>
                    </div>
                    <textarea
                        className="csv-textarea"
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder={`HU;Dev1;Dev2;QA1\nHistoria 1;5;3;8\nHistoria 2;2;4;`}
                        spellCheck={false}
                    />
                    {error && <div className="error-msg">⚠ {error}</div>}
                    <div className="card-actions">
                        <button className="btn-load-sample" onClick={() => setCsvText(SAMPLE_CSV)}>
                            Ver ejemplo
                        </button>
                        <button
                            className="btn-generate"
                            onClick={() => onParse(csvText)}
                            disabled={!csvText.trim()}
                        >
                            Generar Gantt →
                        </button>
                    </div>
                </div>

                {/* File drop + format */}
                <div className="upload-right">
                    <div
                        className={`drop-zone ${dragging ? 'dragging' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileRef.current?.click()}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.txt"
                            style={{display: 'none'}}
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                        <div className="drop-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <polyline points="9 15 12 12 15 15"/>
                            </svg>
                        </div>
                        <p className="drop-label">{dragging ? 'Suelta aquí' : 'Arrastra un .csv'}</p>
                        <p className="drop-sub">o haz clic para seleccionar</p>
                    </div>

                    <div className="format-card">
                        <div className="card-header">
                            <span className="card-tag">03</span>
                            <span className="card-title">Formato</span>
                        </div>
                        <div className="format-body">
                            <pre
                                className="format-pre">{`P;HU;Dev1;Dev2;QA1;...\n2;Historia 1;5;3;8\n1;Historia 2;2;;4\n3;Historia 3;1;2;`}</pre>
                            <ul className="format-rules">
                                <li><span className="rule-dot accent"/><b>P</b> (opcional): ordena las HUs</li>
                                <li><span className="rule-dot accent"/>Segunda (o primera) columna: nombre de la HU</li>
                                <li><span className="rule-dot"/>Columnas siguientes: cualquier rol</li>
                                <li><span className="rule-dot"/>Valores: días estimados (enteros)</li>
                                <li><span className="rule-dot"/>Vacío = ese rol no participa</li>
                                <li><span className="rule-dot accent"/>Separador: punto y coma (;)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
