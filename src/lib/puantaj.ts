import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import type { ShiftType } from '@/types'

type ShiftValue = ShiftType | 'OFF' | null

interface StaffMember {
    uid: string
    name: string
    is_hidden_in_roster?: boolean
}

interface GeneratePuantajOptions {
    staff: StaffMember[]
    schedule: Record<string, Record<string, ShiftValue>>
    year: number
    month: number // 0-indexed (0 = January)
    today?: Date
}

const TR_MONTH_NAMES = [
    'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
    'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
]

const TEMPLATE_URL = '/templates/puantaj-template.xlsx'

// Header row 7 maps day-of-month to column letter F..AJ (day 1..31)
// F = column 6, so col(day) = 5 + day
const FIRST_DAY_COL = 6 // F
const NAME_COL = 3      // C (ADI VE SOYADI)
const SNO_COL = 2       // B (S.NO)
const FIRST_DATA_ROW = 8
const MONTH_CELL = 'D2'
const YEAR_CELL = 'D3'

/**
 * Reads day-of-week from schedule and maps roster shift -> puantaj code.
 *   any shift (A/B/C/E) -> "X" (çalıştı)
 *   OFF                 -> "HT" (haftalık tatil)
 *   null / no entry     -> blank
 */
function shiftToCode(shift: ShiftValue): string {
    if (!shift) return ''
    if (shift === 'OFF') return 'HT'
    return 'X'
}

/**
 * Generates a filled puantaj xlsx from the template and triggers a browser download.
 * Only fills:
 *   - D2 (month name in Turkish, uppercase)
 *   - D3 (year)
 *   - C8..C{n} (staff names)
 *   - B8..B{n} (sequence numbers)
 *   - F8..AJ{n} (per-day codes)
 * Everything else in the template (header, formulas, styling) is preserved as-is.
 */
export async function generatePuantaj({
    staff,
    schedule,
    year,
    month,
    today = new Date(),
}: GeneratePuantajOptions): Promise<void> {
    // Filter & sort visible staff (preserve current sort order)
    const visibleStaff = staff.filter(s => !s.is_hidden_in_roster)

    // Load template
    const response = await fetch(TEMPLATE_URL)
    if (!response.ok) {
        throw new Error(`Failed to load puantaj template (${response.status})`)
    }
    const buffer = await response.arrayBuffer()

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const ws = workbook.getWorksheet('ÖNBÜRO') || workbook.worksheets[0]
    if (!ws) throw new Error('Puantaj template has no worksheets')

    // Set month name and year
    ws.getCell(MONTH_CELL).value = TR_MONTH_NAMES[month]
    ws.getCell(YEAR_CELL).value = year

    // Ensure day columns are wide enough for 2-digit numbers + X/HT.
    // Original template uses width 3.0 which clips "10"-"30" to "###" in Excel.
    for (let day = 1; day <= 31; day++) {
        const col = ws.getColumn(FIRST_DAY_COL + day - 1)
        if (!col.width || col.width < 4) {
            col.width = 4
        }
    }

    // Determine which days to write up to (today if current month, full month otherwise)
    const isCurrentOrFutureMonth =
        year > today.getFullYear() ||
        (year === today.getFullYear() && month >= today.getMonth())
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    const lastDayInMonth = new Date(year, month + 1, 0).getDate()
    const cutoffDay = isCurrentMonth
        ? today.getDate()
        : (isCurrentOrFutureMonth ? 0 : lastDayInMonth)

    // Clear any pre-existing rows in the data area to avoid stale names/codes
    // (we keep the formula columns AK..AU — they will recompute)
    const MAX_EXPECTED_ROWS = 60
    for (let r = FIRST_DATA_ROW; r < FIRST_DATA_ROW + MAX_EXPECTED_ROWS; r++) {
        ws.getCell(r, SNO_COL).value = null
        ws.getCell(r, NAME_COL).value = null
        for (let c = FIRST_DAY_COL; c < FIRST_DAY_COL + 31; c++) {
            ws.getCell(r, c).value = null
        }
    }

    // Fill staff rows
    visibleStaff.forEach((member, idx) => {
        const row = FIRST_DATA_ROW + idx
        ws.getCell(row, SNO_COL).value = idx + 1
        ws.getCell(row, NAME_COL).value = member.name.toUpperCase()

        for (let day = 1; day <= lastDayInMonth; day++) {
            if (cutoffDay > 0 && day > cutoffDay) break // leave future days blank

            const date = new Date(year, month, day)
            const dateKey = format(date, 'yyyy-MM-dd')
            const shift = schedule[member.uid]?.[dateKey]
            const code = shiftToCode(shift ?? null)
            if (code) {
                ws.getCell(row, FIRST_DAY_COL + day - 1).value = code
            }
        }
    })

    // Trigger download
    const out = await workbook.xlsx.writeBuffer()
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = `Puantaj_${TR_MONTH_NAMES[month]}_${year}.xlsx`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
