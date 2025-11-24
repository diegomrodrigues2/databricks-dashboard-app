import { toPng } from 'html-to-image';
import { csvFormat } from 'd3-dsv';
import * as XLSX from 'xlsx';

// Function to trigger file download from a Blob
const downloadBlob = (blob: Blob, fileName: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Function to sanitize data to prevent CSV injection
const sanitizeDataForCsv = (data: any[]): any[] => {
    if (!data || data.length === 0) return [];
    const specialChars = ['=', '+', '-', '@'];
    const headers = Object.keys(data[0]);
    return data.map(row => {
        const sanitizedRow: { [key: string]: any } = {};
        headers.forEach(header => {
            const value = row[header];
            if (typeof value === 'string' && specialChars.includes(value.charAt(0))) {
                sanitizedRow[header] = `'${value}`;
            } else {
                sanitizedRow[header] = value;
            }
        });
        return sanitizedRow;
    });
};

// Export to CSV using d3-dsv
export const exportToCsv = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
      alert("No data to export.");
      return;
  }
  const sanitized = sanitizeDataForCsv(data);
  const csvString = csvFormat(sanitized);
  // Add BOM for Excel to recognize UTF-8
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${fileName}.csv`);
};

// Export to XLSX using SheetJS
export const exportToXlsx = (data: any[], fileName: string) => {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data, { cellDates: true });
    // Note: SheetJS's json_to_sheet will automatically handle formula-like strings
    // by quoting them if they don't seem to be actual formulas, which is a decent
    // level of protection. For full safety, manual cell type setting would be needed,
    // but this is a good balance of simplicity and security.
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(blob, `${fileName}.xlsx`);
};


// Export to PNG
export const exportToPng = async (element: HTMLElement, fileName: string) => {
    if (!element) return;
    try {
        const dataUrl = await toPng(element, { 
            backgroundColor: '#1f2937', // Match bg-gray-800 or similar dark theme color
            pixelRatio: 2 // For higher resolution
        });
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('oops, something went wrong!', error);
    }
};