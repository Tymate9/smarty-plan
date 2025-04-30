class DateFormatter {
  formatDate(date?: Date): string {
    if (date) return new Date(date).toISOString().slice(0,10)
    else return ""
  }

  formatDateHM(date?: Date): string {
    if (date) return new Date(date).toISOString().slice(0,16).replace('T', ' ')
    else return ""
  }

  formatDateHMS(date?: Date): string {
    if (date) return new Date(date).toISOString().slice(0,19).replace('T', ' ')
    else return ""
  }
}

export const DATE_FORMATTER = new DateFormatter()
