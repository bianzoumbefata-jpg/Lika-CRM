// Export data to CSV and trigger browser download
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ';';
  const keys = Object.keys(rows[0]);
  
  const csvContent = [
    keys.join(separator),
    ...rows.map(row =>
      keys.map(key => {
        let val = row[key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(separator)
    )
  ].join('\r\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Parse CSV text to array of objects
export function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];

  // Determine separator (; or ,)
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  
  const headers = headerLine.split(separator).map(h => h.replace(/^["']|["']$/g, '').trim());

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple split accounting for quoted values
    const regex = new RegExp(`(?:^|${separator})(?:"([^"]*(?:""[^"]*)*)"|([^${separator}]*))`, 'g');
    const values = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      values.push(val ? val.trim() : '');
      if (regex.lastIndex === 0) break;
    }

    if (values.length > 0) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      result.push(obj);
    }
  }

  return result;
}
