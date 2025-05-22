export function downloadAsCsv(
  csvContent: (string | number)[][],
  fileName: string,
  locale: 'fr-FR' | 'en-US' = 'fr-FR'
) {
  const csvString = csvContent.map(
    row => row.map(
      cell => typeof cell === 'number' && locale === 'fr-FR' ? cell.toString().replace('.', ',') : cell
    ).join(locale === 'fr-FR' ? ';' : ',')
  ).join('\n');
  const encodedUri = encodeURI(csvString);
  const link = document.createElement("a");
  link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodedUri);
  link.setAttribute("download", fileName);
  link.click();
}
