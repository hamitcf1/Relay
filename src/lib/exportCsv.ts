/**
 * Utility to export JSON arrays to CSV format with UTF-8 BOM
 * ensuring full Turkish character compatibility in Microsoft Excel.
 */

export function exportToCsv(filename: string, rows: Record<string, any>[]) {
    if (!rows || rows.length === 0) return

    const headers = Object.keys(rows[0])
    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            headers
                .map(header => {
                    const value = row[header] ?? ''
                    const stringified = String(value).replace(/"/g, '""')
                    return `"${stringified}"`
                })
                .join(',')
        )
    ].join('\r\n')

    // UTF-8 BOM prefix
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    const nav = navigator as any
    if (nav.msSaveBlob) {
        nav.msSaveBlob(blob, filename)
    } else {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
}
