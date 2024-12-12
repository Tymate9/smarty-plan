export function downloadAsCsv(csvRows: string[], fileName: string) {
  // Créer un blob à partir du contenu CSV
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });

  // Générer un lien temporaire pour le téléchargement
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
