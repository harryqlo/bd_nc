export const downloadJSON = (data: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  data.forEach(row => {
    const values = headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return '"' + val.replace(/"/g, '""') + '"';
    });
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
};

export const downloadCSV = (data: any[], fileName: string) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

import * as XLSX from 'xlsx';

export const downloadExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, fileName);
};

export const downloadPDF = (data: any[], title: string) => {
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const tableRows = data.map(row => '<tr>' + headers.map(h => `<td>${row[h] ?? ''}</td>`).join('') + '</tr>').join('');
  const html = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1><table border="1" cellspacing="0" cellpadding="4"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};
