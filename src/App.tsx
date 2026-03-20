import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import GanttChart from './components/GanttChart'
import UploadScreen from './pages/UploadScreen'
import HolidayManager from './components/HolidayManager'
import { getDefaultSprintDates, loadHolidays, saveHolidays } from './utils/sprint'
import type { ParsedData, Holiday, Story } from './types'
import './styles/globals.css'

function App() {
  const [data,   setData]   = useState<ParsedData | null>(null)
  const [error,  setError]  = useState<string | null>(null)
  const defaults            = getDefaultSprintDates()
  const [sprintStart, setSprintStart] = useState<string>(defaults.start)
  const [sprintEnd,   setSprintEnd]   = useState<string>(defaults.end)
  const [holidays,    setHolidays]    = useState<Holiday[]>(() => loadHolidays())

  const parseCSV = useCallback((text: string): void => {
    setError(null)
    try {
      const result = Papa.parse<string[]>(text.trim(), {
        delimiter: ';',
        header: false,
        skipEmptyLines: true,
      })
      const rows = result.data
      if (!rows || rows.length < 2)
        throw new Error('El CSV debe tener encabezado y al menos una historia.')

      const headers = rows[0].map((h) => h.trim())

      // Detect optional "p" first column (before HU)
      const hasPriority = headers[0].toLowerCase() === 'p'
      const huColIdx    = hasPriority ? 1 : 0

      if (headers[huColIdx]?.toLowerCase() !== 'hu')
        throw new Error('Se esperaba columna "HU" (con o sin "P" antes).')

      // Member columns start after HU
      const members = headers.slice(huColIdx + 1).filter((h) => h.trim() !== '')

      const stories: Story[] = []
      for (let i = 1; i < rows.length; i++) {
        const row      = rows[i]
        const priority = hasPriority ? parseInt(row[0] ?? '') : i
        const hu       = row[huColIdx]?.trim()
        if (!hu) continue
        const points: Record<string, number> = {}
        members.forEach((m, idx) => {
          const val = parseInt(row[huColIdx + 1 + idx] ?? '')
          if (!isNaN(val) && val > 0) points[m] = val
        })
        stories.push({
          hu,
          points,
          priority: isNaN(priority) ? 9999 : priority,
        })
      }

      if (!stories.length)
        throw new Error('No se encontraron historias de usuario válidas.')

      // Sort by priority ascending
      stories.sort((a, b) => a.priority - b.priority)

      setData({ members, stories, hasPriority })
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const handleAddHoliday = (h: Holiday): void => {
    const next = [...holidays, h]
    setHolidays(next)
    saveHolidays(next)
  }

  const handleRemoveHoliday = (date: string): void => {
    const next = holidays.filter((h) => h.date !== date)
    setHolidays(next)
    saveHolidays(next)
  }

  const holidayDates = holidays.map((h) => h.date)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-mark">
            <span className="logo-bar" style={{ height: 12 }} />
            <span className="logo-bar" style={{ height: 18 }} />
            <span className="logo-bar" style={{ height: 8  }} />
            <span className="logo-bar" style={{ height: 22 }} />
            <span className="logo-bar" style={{ height: 14 }} />
          </div>
          <div>
            <h1 className="app-title">Sprint Road Map</h1>
            <p className="app-sub">Visualización Gantt · días hábiles</p>
          </div>
        </div>

        <div className="header-right ">
          {data && (
            <>
              <div className="header-dates">
                <div className="header-date-field">
                  <label className="date-label">Inicio</label>
                  <input
                    type="date"
                    className="date-input"
                    value={sprintStart}
                    onChange={(e) => setSprintStart(e.target.value)}
                  />
                </div>
                <span className="header-date-sep">→</span>
                <div className="header-date-field">
                  <label className="date-label">Fin</label>
                  <input
                    type="date"
                    className="date-input"
                    value={sprintEnd}
                    min={sprintStart}
                    onChange={(e) => setSprintEnd(e.target.value)}
                  />
                </div>
              </div>

              <HolidayManager
                holidays={holidays}
                onAdd={handleAddHoliday}
                onRemove={handleRemoveHoliday}
                sprintStart={sprintStart}
                sprintEnd={sprintEnd}
              />

              <button
                className="btn-reset"
                onClick={() => { setData(null); setError(null) }}
              >
                ← Nuevo CSV
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {!data ? (
          <UploadScreen
            onParse={parseCSV}
            error={error}
            sprintStart={sprintStart}
            sprintEnd={sprintEnd}
            onDatesChange={(s, e) => { setSprintStart(s); setSprintEnd(e) }}
            holidays={holidays}
            onAddHoliday={handleAddHoliday}
            onRemoveHoliday={handleRemoveHoliday}
          />
        ) : (
          <GanttChart
            data={data}
            sprintStart={sprintStart}
            sprintEnd={sprintEnd}
            holidays={holidayDates}
            holidayMap={Object.fromEntries(holidays.map((h) => [h.date, h.name]))}
          />
        )}
      </main>
    </div>
  )
}

export default App
