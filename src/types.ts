// ─── Domain types ────────────────────────────────────────────────────────────

export interface Story {
  hu: string
  points: Record<string, number>
  priority: number
}

export interface ParsedData {
  members: string[]
  stories: Story[]
  hasPriority: boolean
}

export interface Holiday {
  date: string  // ISO YYYY-MM-DD
  name: string
}

// ─── Schedule ────────────────────────────────────────────────────────────────

/** Map of story HU → member → array of working-day indices */
export type Schedule = Record<string, Record<string, number[]>>

// ─── Color palette entry ──────────────────────────────────────────────────────

export interface MemberColor {
  bg: string
  text: string
  border: string
  chipBg: string
  chipText: string
  chipBorder: string
  dotBg: string
  dotBorder: string
}

// ─── Sprint calculation results ───────────────────────────────────────────────

export interface SprintDays {
  workingDays: Date[]
  calendarDays: Date[]
  allWeekdays: Date[]
  sprintWeekdays: Date[]
  firstLastSet: Set<string>
  holidaySet: Set<string>
}

export interface DefaultSprintDates {
  start: string
  end: string
}

// ─── Bar segment (Gantt overlay) ──────────────────────────────────────────────

export interface BarSegment {
  left: number
  width: number
  top: number
  height: number
  color: MemberColor
  member: string
  story: string
}

// ─── Column / row position measurements ──────────────────────────────────────

export interface ColPosition {
  left: number
  width: number
}

export interface RowPosition {
  top: number
}

// ─── Member stats ─────────────────────────────────────────────────────────────

export interface MemberStats {
  total: number
  allocated: number
  pct: number
  overflow: boolean
}
