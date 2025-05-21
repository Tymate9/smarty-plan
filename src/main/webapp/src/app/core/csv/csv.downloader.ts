export function downloadAsCsv(csvRows: string[], fileName: string) {
  const encodedUri = encodeURI(csvRows.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodedUri);
  link.setAttribute("download", fileName);
  link.click();
}
