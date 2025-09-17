export interface ParsedTime {
  hour: number
  min: number
}

export function parseTimeString(timeStr: string): ParsedTime {
  const cleanTime = timeStr.trim()
  const isPM = cleanTime.includes('pm')
  const isAM = cleanTime.includes('am')
  const timeOnly = cleanTime.replace(/[ap]m/g, '').trim()
  const [hourStr, minStr] = timeOnly.split(':')
  let hour = parseInt(hourStr)
  const min = parseInt(minStr) || 0

  if (isPM && hour !== 12) hour += 12
  if (isAM && hour === 12) hour = 0

  return { hour, min }
}

export function parseClassDays(daysStr: string): string[] {
  const classDays = []
  let i = 0
  while (i < daysStr.length) {
    if (i < daysStr.length - 1 && daysStr.slice(i, i + 2) === 'Th') {
      classDays.push('R')
      i += 2
    } else if (daysStr[i] === 'R') {
      classDays.push('R')
      i++
    } else if (['M', 'T', 'W', 'F'].includes(daysStr[i])) {
      classDays.push(daysStr[i])
      i++
    } else {
      i++
    }
  }
  return classDays
}

export function parseClassTime(timeStr: string): { days: string[], startTime: ParsedTime, endTime: ParsedTime } | null {
  if (!timeStr || timeStr === 'TBA' || timeStr.trim() === '') {
    return null
  }

  const parts = timeStr.split(' ')
  if (parts.length < 3) return null

  const days = parts[0]
  const timeRange = parts.slice(1).join(' ')
  const [startTimeStr, endTimeStr] = timeRange.split('-')

  if (!startTimeStr || !endTimeStr) return null

  try {
    const startTime = parseTimeString(startTimeStr)
    const endTime = parseTimeString(endTimeStr)
    const classDays = parseClassDays(days)

    return { days: classDays, startTime, endTime }
  } catch (error) {
    return null
  }
}