import {useMemo, useState, useRef, useLayoutEffect, useCallback} from 'react'
import {getSprintDays, buildSchedule, MEMBER_COLORS, toISO} from '../../utils/sprint'
import type {ParsedData, BarSegment, ColPosition, RowPosition, MemberStats} from '../../types'
import './GanttChart.css'

const DAYS_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function fmt(d: Date): string {
    return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`
}

const ROW_HEIGHT = 52
const BAR_H = 22
const BAR_GAP = 4
const BAR_INSET_V = 8

interface GanttChartProps {
    data: ParsedData
    sprintStart: string
    sprintEnd: string
    holidays?: string[]
    holidayMap?: Record<string, string>
}

export default function GanttChart({
                                       data,
                                       sprintStart,
                                       sprintEnd,
                                       holidays = [],
                                       holidayMap = {},
                                   }: GanttChartProps) {
    const {members, stories, hasPriority} = data
    const [hoveredMember, setHoveredMember] = useState<string | null>(null)
    const [colPositions, setColPositions] = useState<ColPosition[]>([])
    const [rowPositions, setRowPositions] = useState<RowPosition[]>([])
    const tableRef = useRef<HTMLTableElement>(null)

    const {workingDays, calendarDays, firstLastSet, holidaySet, schedule, stats} = useMemo(() => {
        const sprint = getSprintDays(sprintStart, sprintEnd, holidays)
        const {workingDays, calendarDays, firstLastSet, holidaySet} = sprint
        const schedule = buildSchedule(members, stories, workingDays)

        const stats: Record<string, MemberStats> = {}
        members.forEach((m) => {
            let total = 0
            stories.forEach((s) => {
                total += s.points[m] ?? 0
            })
            const allocated = Math.min(total, workingDays.length)
            stats[m] = {
                total,
                allocated,
                pct: workingDays.length > 0 ? Math.round((allocated / workingDays.length) * 100) : 0,
                overflow: total > workingDays.length,
            }
        })

        return {workingDays, calendarDays, firstLastSet, holidaySet, schedule, stats}
    }, [members, stories, sprintStart, sprintEnd, holidays])

    const weekdayDays = calendarDays.filter((d) => d.getDay() !== 0 && d.getDay() !== 6)
    const startTime = calendarDays[0]?.getTime() ?? 0

    const getWeekGroup = (d: Date): number =>
        Math.floor((d.getTime() - startTime) / (7 * 86400000))

    const weekMap: Record<number, Date[]> = {}
    weekdayDays.forEach((d) => {
        const wg = getWeekGroup(d)
        if (!weekMap[wg]) weekMap[wg] = []
        weekMap[wg].push(d)
    })
    const weekGroups = Object.values(weekMap)

    const isHolidayDay = (d: Date): boolean => holidaySet.has(toISO(d))
    const isFirstLastDay = (d: Date): boolean => firstLastSet.has(toISO(d))
    const isWorkingDay = (d: Date): boolean => workingDays.some((w) => toISO(w) === toISO(d))
    const getWorkingDayIdx = (d: Date): number => workingDays.findIndex((w) => toISO(w) === toISO(d))
    const getColor = (idx: number): typeof MEMBER_COLORS[number] => MEMBER_COLORS[idx % MEMBER_COLORS.length]
    const getMemberIdx = (m: string): number => members.indexOf(m)

    const measurePositions = useCallback(() => {
        if (!tableRef.current) return
        const table = tableRef.current
        const scrollContainer = table.closest('.gantt-scroll')
        const scrollLeft = scrollContainer ? (scrollContainer as HTMLElement).scrollLeft : 0
        const dayHeaders = table.querySelectorAll<HTMLTableCellElement>('thead tr:last-child th.th-day')
        const tableRect = table.getBoundingClientRect()

        const cols: ColPosition[] = []
        dayHeaders.forEach((th) => {
            const r = th.getBoundingClientRect()
            cols.push({left: r.left - tableRect.left + scrollLeft, width: r.width})
        })
        setColPositions(cols)

        const rows = table.querySelectorAll<HTMLTableRowElement>('tbody tr.story-row')
        const rowPos: RowPosition[] = []
        rows.forEach((tr) => {
            const r = tr.getBoundingClientRect()
            rowPos.push({top: r.top - tableRect.top})
        })
        setRowPositions(rowPos)
    }, [weekdayDays.length, stories.length])

    useLayoutEffect(() => {
        measurePositions()
        const obs = new ResizeObserver(measurePositions)
        if (tableRef.current) obs.observe(tableRef.current)
        const scroll = tableRef.current?.closest('.gantt-scroll') as HTMLElement | null
        if (scroll) scroll.addEventListener('scroll', measurePositions)
        return () => {
            obs.disconnect()
            if (scroll) scroll.removeEventListener('scroll', measurePositions)
        }
    }, [measurePositions, holidays, sprintStart, sprintEnd])

    const barSegments = useMemo((): BarSegment[] => {
        if (!colPositions.length || !rowPositions.length) return []

        const segments: BarSegment[] = []
        const wdIdxToColIdx: Record<number, number> = {}
        weekdayDays.forEach((d, colIdx) => {
            const wdIdx = getWorkingDayIdx(d)
            if (wdIdx >= 0) wdIdxToColIdx[wdIdx] = colIdx
        })

        stories.forEach((story, si) => {
            const rowTop = rowPositions[si]?.top ?? 0
            const activeMembers = members.filter((m) => story.points[m])

            activeMembers.forEach((m, mi) => {
                const mDays = schedule[story.hu]?.[m] ?? []
                if (!mDays.length) return
                const c = getColor(getMemberIdx(m))

                const runs: number[][] = []
                let run = [mDays[0]]

                for (let i = 1; i < mDays.length; i++) {
                    const prevColIdx = wdIdxToColIdx[mDays[i - 1]]
                    const currColIdx = wdIdxToColIdx[mDays[i]]
                    let bridgeable = true

                    if (currColIdx !== undefined && prevColIdx !== undefined) {
                        for (let c2 = prevColIdx + 1; c2 < currColIdx; c2++) {
                            const d = weekdayDays[c2]
                            if (d && isWorkingDay(d)) {
                                bridgeable = false;
                                break
                            }
                        }
                    }

                    if (bridgeable) {
                        run.push(mDays[i])
                    } else {
                        runs.push(run)
                        run = [mDays[i]]
                    }
                }
                runs.push(run)

                runs.forEach((r) => {
                    const firstColIdx = wdIdxToColIdx[r[0]]
                    const lastColIdx = wdIdxToColIdx[r[r.length - 1]]
                    if (firstColIdx === undefined || lastColIdx === undefined) return

                    const firstCol = colPositions[firstColIdx]
                    const lastCol = colPositions[lastColIdx]
                    if (!firstCol || !lastCol) return

                    const INSET = 1
                    const left = firstCol.left + INSET
                    const right = lastCol.left + lastCol.width - INSET
                    const barTop = rowTop + BAR_INSET_V + mi * (BAR_H + BAR_GAP)

                    segments.push({
                        left,
                        width: right - left,
                        top: barTop,
                        height: BAR_H,
                        color: c,
                        member: m,
                        story: story.hu,
                    })
                })
            })
        })

        return segments
    }, [colPositions, rowPositions, schedule, stories, members, weekdayDays, workingDays])

    const overlayHeight = rowPositions.length
        ? (rowPositions[rowPositions.length - 1]?.top ?? 0) + ROW_HEIGHT
        : 0

    return (
        <div className="gantt-root">
            {/* Stats bar */}
            <div className="stats-bar">
                <div className="sprint-range">
                    <span className="sr-label">Sprint</span>
                    <span className="sr-val">
            {fmt(calendarDays[0])} → {fmt(calendarDays[calendarDays.length - 1])}
          </span>
                    <span className="sr-chip">{workingDays.length} días hábiles</span>
                    {holidays.length > 0 && (
                        <span className="sr-chip sr-chip-holiday">
              {holidays.length} feriado{holidays.length > 1 ? 's' : ''}
            </span>
                    )}
                </div>

                <div className="member-stats">
                    {members.map((m, i) => {
                        const c = getColor(i)
                        const s = stats[m]
                        const active = hoveredMember === m
                        return (
                            <div
                                key={m}
                                className={`stat-chip ${active ? 'active' : ''}`}
                                style={{
                                    background: active ? c.chipBg : '#f8fafc',
                                    borderColor: active ? c.chipBorder : '#e2e8f0',
                                }}
                                onMouseEnter={() => setHoveredMember(m)}
                                onMouseLeave={() => setHoveredMember(null)}
                            >
                                <span className="chip-swatch" style={{background: c.bg}}/>
                                <span className="chip-name" style={{color: active ? c.chipText : '#475569'}}>{m}</span>
                                <span className="chip-dash" style={{background: c.bg}}/>
                                <span className="chip-pts"
                                      style={{color: active ? c.chipText : '#64748b'}}>{s?.total ?? 0}P</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="gantt-outer">
                <div className="gantt-scroll">
                    <div style={{position: 'relative'}}>
                        <table className="gantt-table" ref={tableRef}>
                            <colgroup>
                                <col className="col-hu"/>
                                {weekdayDays.map((_, i) => <col key={i} className="col-day"/>)}
                            </colgroup>

                            <thead>
                            <tr>
                                <th className="th-hu th-week" rowSpan={2}>Historia de usuario</th>
                                {weekGroups.map((wDays, wi) => (
                                    <th key={wi} colSpan={wDays.length} className="th-week-label">
                                        Semana {wi + 1}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {weekdayDays.map((d, i) => {
                                    const iso = toISO(d)
                                    const isHol = isHolidayDay(d)
                                    const isFL = isFirstLastDay(d)
                                    const isWork = isWorkingDay(d)
                                    return (
                                        <th
                                            key={i}
                                            className={`th-day ${isWork ? 'th-sprint-day' : ''} ${isHol ? 'th-holiday' : ''} ${isFL ? 'th-blocked' : ''}`}
                                            title={isHol ? holidayMap[iso] : isFL ? 'Día de ceremonia' : ''}
                                        >
                                            <span className="day-dow">{DAYS_ES[d.getDay()]}</span>
                                            <span className="day-num">{d.getDate()}</span>
                                            {isHol && <span className="day-hol-dot"/>}
                                        </th>
                                    )
                                })}
                            </tr>
                            </thead>

                            <tbody>
                            {stories.map((story, si) => {
                                const activeMembers = members.filter((m) => story.points[m])
                                const rowH = Math.max(
                                    ROW_HEIGHT,
                                    BAR_INSET_V * 2 + activeMembers.length * (BAR_H + BAR_GAP),
                                )
                                return (
                                    <tr key={story.hu} className="story-row" style={{height: rowH}}>
                                        <td className="td-hu">
                                            <div className="hu-content">
                                                {hasPriority
                                                    ? <span className="hu-priority">P{story.priority}</span>
                                                    :
                                                    <span className="hu-index">{String(si + 1).padStart(2, '0')}</span>
                                                }
                                                <span className="hu-name">{story.hu}</span>
                                            </div>
                                        </td>
                                        {weekdayDays.map((d, ci) => {
                                            const isHol = isHolidayDay(d)
                                            const isFL = isFirstLastDay(d)
                                            const isWork = isWorkingDay(d)
                                            return (
                                                <td
                                                    key={ci}
                                                    className={`td-day ${isHol ? 'td-holiday' : ''} ${isFL ? 'td-firstlast' : ''} ${!isWork && !isHol && !isFL ? 'td-outside' : ''}`}
                                                    title={isHol ? `🎌 ${holidayMap[toISO(d)]}` : ''}
                                                >
                                                    {isHol && (
                                                        <div className="holiday-cell-label">
                                                            <span className="hol-flag">🎌</span>
                                                        </div>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>

                        {barSegments.length > 0 && (
                            <div className="bars-overlay" style={{height: overlayHeight}} aria-hidden="true">
                                {barSegments.map((seg, i) => {
                                    const dimmed = hoveredMember && hoveredMember !== seg.member
                                    return (
                                        <div
                                            key={i}
                                            className={`bar-seg ${dimmed ? 'dimmed' : ''}`}
                                            style={{
                                                left: seg.left,
                                                top: seg.top,
                                                width: seg.width,
                                                height: seg.height,
                                                background: seg.color.bg,
                                                border: `1px solid ${seg.color.border}`,
                                            }}
                                            title={`${seg.member} · ${seg.story}`}
                                            onMouseEnter={() => setHoveredMember(seg.member)}
                                            onMouseLeave={() => setHoveredMember(null)}
                                        >
                                            <span className="bar-seg-label">{seg.member}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="gantt-footer">
                <div className="legend-wrap">
                    {members.map((m, i) => {
                        const c = getColor(i)
                        const s = stats[m]
                        const active = hoveredMember === m
                        return (
                            <div
                                key={m}
                                className={`legend-item ${active ? 'legend-active' : ''}`}
                                onMouseEnter={() => setHoveredMember(m)}
                                onMouseLeave={() => setHoveredMember(null)}
                            >
                <span
                    className="legend-dot"
                    style={{
                        background: c.dotBg,
                        borderColor: c.dotBorder,
                        outline: active ? `2px solid ${c.bg}` : 'none',
                    }}
                />
                                <span className="legend-name">{m}</span>
                                <span className="legend-pts" style={{color: c.bg, fontWeight: 600}}>
                  {s?.total ?? 0}P
                </span>
                                <span className="legend-extra" style={{color: s?.overflow ? '#dc2626' : '#6c6d6e'}}>
                  {s?.overflow
                      ? `+${(s.total ?? 0) - workingDays.length} sobrecarga`
                      : `${s?.pct ?? 0}%`}
                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="legend-keys">
                    <div className="legend-key">
                        <span className="lk-box lk-blocked"/>
                        <span>Ceremonia</span>
                    </div>
                    <div className="legend-key">
                        <span className="lk-box lk-holiday"/>
                        <span>Feriado</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
