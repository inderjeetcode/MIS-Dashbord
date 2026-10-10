import * as XLSX from 'xlsx';
import { StandardMISRecord } from '../types';

export function exportRecordsToExcel(records: StandardMISRecord[], fileName: string = 'MIS_Standardized_Revenue.xlsx') {
  const exportData = records.map((r, idx) => ({
    'Sl No': idx + 1,
    'Client Name': r.clientName,
    'Client ID': r.clientId,
    'Patient Name': r.patientName,
    'Patient ID': r.patientId,
    'Provider / Performed Staff': r.provider,
    'Plan Item': r.planItem,
    'Quantity': r.quantity,
    'Service Category': r.serviceCategory,
    'Raw Category': r.rawCategory,
    'Invoice Date': r.invoiceDate,
    'Month': r.month,
    'Year': r.year,
    'Invoice No': r.invoiceNo,
    'Billed Amount (₹)': r.billedAmount,
    'Branch': r.branch,
    'Validation Status': r.validationStatus,
    'Notes / Issues': r.notes.join('; '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  // Auto-width columns
  const wscols = [
    { wch: 6 },  // Sl No
    { wch: 18 }, // Client Name
    { wch: 12 }, // Client ID
    { wch: 16 }, // Patient Name
    { wch: 12 }, // Patient ID
    { wch: 20 }, // Provider
    { wch: 26 }, // Plan Item
    { wch: 8 },  // Quantity
    { wch: 20 }, // Category
    { wch: 18 }, // Raw Category
    { wch: 12 }, // Date
    { wch: 10 }, // Month
    { wch: 8 },  // Year
    { wch: 16 }, // Invoice No
    { wch: 16 }, // Billed Amount
    { wch: 16 }, // Branch
    { wch: 16 }, // Status
    { wch: 30 }, // Notes
  ];
  worksheet['!cols'] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Standardized MIS Data');

  XLSX.writeFile(workbook, fileName);
}

export function exportRecordsToCSV(records: StandardMISRecord[], fileName: string = 'MIS_Standardized_Revenue.csv') {
  const exportData = records.map((r, idx) => ({
    'Sl No': idx + 1,
    'Client Name': r.clientName,
    'Client ID': r.clientId,
    'Patient Name': r.patientName,
    'Patient ID': r.patientId,
    'Provider / Performed Staff': r.provider,
    'Plan Item': r.planItem,
    'Quantity': r.quantity,
    'Service Category': r.serviceCategory,
    'Invoice Date': r.invoiceDate,
    'Month': r.month,
    'Year': r.year,
    'Invoice No': r.invoiceNo,
    'Billed Amount (INR)': r.billedAmount,
    'Branch': r.branch,
    'Validation Status': r.validationStatus,
    'Notes': r.notes.join('; '),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadVETportTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const templateHeaders = [
    {
      'Client Name': 'Rahul Mehra',
      'Client ID': '001042',
      'Patient Name': 'Bruno (Golden Retriever)',
      'Patient ID': '008914',
      'Plan Item Name': 'OPD General Consultation',
      'Plan Item Quantity': 1,
      'Service Category': 'OPD consultation',
      'Performed Staff': 'Dr. Priya Sharma',
      'Invoice Date': '2026-10-05',
      'Invoice No': '004128',
      'Billed Amount': 800.0,
      'Branch': 'Indiranagar',
    },
    {
      'Client Name': 'Sneha Kapoor',
      'Client ID': '001088',
      'Patient Name': 'Milo (Persian Cat)',
      'Patient ID': '008920',
      'Plan Item Name': 'Full Coat Bath & Grooming',
      'Plan Item Quantity': 1,
      'Service Category': 'Grooming',
      'Performed Staff': 'Arun Kumar',
      'Invoice Date': '2026-10-06',
      'Invoice No': '004129',
      'Billed Amount': 1500.0,
      'Branch': 'Koramangala',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateHeaders);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'VETport Sales Import Template');

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, 'VETport_Sales_Template_12Columns.xlsx');
  } else {
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'VETport_Sales_Template_12Columns.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
