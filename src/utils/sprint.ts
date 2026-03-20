import type {
  SprintDays,
  DefaultSprintDates,
  Schedule,
  Story,
  MemberColor,
  Holiday,
} from '../types'

export function getSprintDays(
  sprintStartStr: string,
  sprintEndStr: string,
  holidays: string[] = [],
): SprintDays {
  const start = new Date(sprintStartStr + 'T00:00:00')
  const end = new Date((sprintEndStr || sprintStartStr) + 'T00:00:00')
  const holidaySet = new Set(holidays)
  const calendarDays: Date[] = []
  const cur = new Date(start)

  while (cur <= end) {
    calendarDays.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }

  const allWeekdays = calendarDays.filter(
    (d) => d.getDay() !== 0 && d.getDay() !== 6,
  )

  const sprintWeekdays =
    allWeekdays.length > 2
      ? allWeekdays.slice(1, allWeekdays.length - 1)
      : allWeekdays

  const workingDays = sprintWeekdays.filter(
    (d) => !holidaySet.has(toISO(d)),
  )

  const firstLastSet = new Set<string>([
    allWeekdays[0] ? toISO(allWeekdays[0]) : '',
    allWeekdays[allWeekdays.length - 1]
      ? toISO(allWeekdays[allWeekdays.length - 1])
      : '',
  ])

  return {
    workingDays,
    calendarDays,
    allWeekdays,
    sprintWeekdays,
    firstLastSet,
    holidaySet,
  }
}

export function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getDefaultSprintDates(): DefaultSprintDates {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 13)
  return {
    start: monday.toISOString().split('T')[0],
    end: friday.toISOString().split('T')[0],
  }
}

export function buildSchedule(
  members: string[],
  stories: Story[],
  workingDays: Date[],
): Schedule {
  const memberCursor: Record<string, number> = {}
  members.forEach((m) => {
    memberCursor[m] = 0
  })

  const schedule: Schedule = {}

  stories.forEach((story) => {
    schedule[story.hu] = {}
    members.forEach((member) => {
      const pts = story.points[member]
      if (!pts) return
      const days: number[] = []
      let cursor = memberCursor[member]
      while (days.length < pts && cursor < workingDays.length) {
        days.push(cursor)
        cursor++
      }
      schedule[story.hu][member] = days
      memberCursor[member] = cursor
    })
  })

  return schedule
}

// Tailwind-based color palette — solid fills with white text
export const MEMBER_COLORS: MemberColor[] = [
  // Blue-600
  {
    bg: '#2563eb',
    text: '#ffffff',
    border: '#1d4ed8',
    chipBg: '#eff6ff',
    chipText: '#1e40af',
    chipBorder: '#bfdbfe',
    dotBg: '#dbeafe',
    dotBorder: '#93c5fd',
  },
  // Emerald-600
  {
    bg: '#059669',
    text: '#ffffff',
    border: '#047857',
    chipBg: '#f0fdf4',
    chipText: '#065f46',
    chipBorder: '#a7f3d0',
    dotBg: '#d1fae5',
    dotBorder: '#6ee7b7',
  },
  // Amber-500
  {
    bg: '#f59e0b',
    text: '#ffffff',
    border: '#d97706',
    chipBg: '#fffbeb',
    chipText: '#92400e',
    chipBorder: '#fcd34d',
    dotBg: '#fef3c7',
    dotBorder: '#fcd34d',
  },
  // Rose-500
  {
    bg: '#f43f5e',
    text: '#ffffff',
    border: '#e11d48',
    chipBg: '#fff1f2',
    chipText: '#9f1239',
    chipBorder: '#fecdd3',
    dotBg: '#ffe4e6',
    dotBorder: '#fda4af',
  },
  // Violet-600
  {
    bg: '#7c3aed',
    text: '#ffffff',
    border: '#6d28d9',
    chipBg: '#f5f3ff',
    chipText: '#4c1d95',
    chipBorder: '#ddd6fe',
    dotBg: '#ede9fe',
    dotBorder: '#c4b5fd',
  },
  // Cyan-600
  {
    bg: '#0891b2',
    text: '#ffffff',
    border: '#0e7490',
    chipBg: '#ecfeff',
    chipText: '#155e75',
    chipBorder: '#a5f3fc',
    dotBg: '#cffafe',
    dotBorder: '#67e8f9',
  },
  // Orange-500
  {
    bg: '#f97316',
    text: '#ffffff',
    border: '#ea580c',
    chipBg: '#fff7ed',
    chipText: '#9a3412',
    chipBorder: '#fed7aa',
    dotBg: '#ffedd5',
    dotBorder: '#fdba74',
  },
  // Pink-600
  {
    bg: '#db2777',
    text: '#ffffff',
    border: '#be185d',
    chipBg: '#fdf2f8',
    chipText: '#831843',
    chipBorder: '#fbcfe8',
    dotBg: '#fce7f3',
    dotBorder: '#f9a8d4',
  },
  // Teal-600
  {
    bg: '#0d9488',
    text: '#ffffff',
    border: '#0f766e',
    chipBg: '#f0fdfa',
    chipText: '#134e4a',
    chipBorder: '#99f6e4',
    dotBg: '#ccfbf1',
    dotBorder: '#5eead4',
  },
  // Indigo-500
  {
    bg: '#6366f1',
    text: '#ffffff',
    border: '#4f46e5',
    chipBg: '#eef2ff',
    chipText: '#3730a3',
    chipBorder: '#c7d2fe',
    dotBg: '#e0e7ff',
    dotBorder: '#a5b4fc',
  },
]

export function loadHolidays(): Holiday[] {
  try {
    const raw = localStorage.getItem('sprint_holidays')
    return raw ? (JSON.parse(raw) as Holiday[]) : []
  } catch {
    return []
  }
}

export function saveHolidays(holidays: Holiday[]): void {
  try {
    localStorage.setItem('sprint_holidays', JSON.stringify(holidays))
  } catch {
    // ignore storage errors
  }
}
