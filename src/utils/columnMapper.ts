export interface MISFieldDefinition {
  key: string;
  label: string;
  description: string;
  aliases: string[];
  required: boolean;
}

export const MIS_STANDARD_FIELDS: MISFieldDefinition[] = [
  {
    key: 'clientName',
    label: 'Client Name',
    description: 'Pet owner or customer name',
    aliases: ['client name', 'client', 'owner name', 'pet owner', 'customer name', 'clientname'],
    required: false,
  },
  {
    key: 'clientId',
    label: 'Client ID',
    description: 'Unique client identifier (preserved as text)',
    aliases: ['client id', 'client code', 'clientid', 'client_id', 'cust id', 'owner id'],
    required: false,
  },
  {
    key: 'patientName',
    label: 'Patient Name',
    description: 'Pet / animal name',
    aliases: ['patient name', 'patient', 'pet name', 'animal name', 'patientname', 'pet'],
    required: false,
  },
  {
    key: 'patientId',
    label: 'Patient ID',
    description: 'Unique patient identifier (preserved as text)',
    aliases: ['patient id', 'pet id', 'patientid', 'patient_id', 'animal id'],
    required: false,
  },
  {
    key: 'planItem',
    label: 'Plan Item Name',
    description: 'Name of the service or billed item',
    aliases: ['plan item name', 'plan item', 'item name', 'service name', 'item', 'planitemname', 'particulars'],
    required: true,
  },
  {
    key: 'quantity',
    label: 'Plan Item Quantity',
    description: 'Quantity delivered (units)',
    aliases: ['plan item quantity', 'quantity', 'qty', 'units', 'plan item qty', 'planitemquantity'],
    required: false,
  },
  {
    key: 'serviceCategory',
    label: 'Service Category',
    description: 'Service department or category',
    aliases: ['service category', 'category', 'department', 'service dept', 'servicecategory', 'dept'],
    required: false,
  },
  {
    key: 'provider',
    label: 'Performed Staff',
    description: 'Staff / doctor who performed the service',
    aliases: ['performed staff', 'performed by', 'provider', 'doctor', 'staff', 'veterinarian', 'performedstaff'],
    required: false,
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    description: 'Date invoice was issued (YYYY-MM-DD)',
    aliases: ['invoice date', 'bill date', 'date', 'invoicedate', 'billing date', 'inv date'],
    required: true,
  },
  {
    key: 'invoiceNo',
    label: 'Invoice No',
    description: 'Invoice / bill reference number (preserved as text)',
    aliases: ['invoice no', 'invoice number', 'invoice #', 'bill no', 'invoiceno', 'invoice_no', 'bill number', 'inv no'],
    required: true,
  },
  {
    key: 'billedAmount',
    label: 'Billed Amount',
    description: 'Total line billed amount (NEVER multiplied by quantity)',
    aliases: ['billed amount', 'amount', 'total amount', 'billedamount', 'net amount', 'line total', 'total billed'],
    required: true,
  },
  {
    key: 'branch',
    label: 'Branch',
    description: 'Hospital / clinic branch location',
    aliases: ['branch', 'location', 'clinic', 'hospital', 'center', 'centre', 'facility'],
    required: false,
  },
];

/**
 * Clean and normalize a column header string
 */
export function cleanHeaderString(header: string): string {
  if (!header) return '';
  return header
    .toString()
    .replace(/\u00A0/g, ' ') // replace non-breaking spaces
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Automatically map source column names to MIS keys
 */
export function autoMapColumns(sourceHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedSourceHeaders = new Set<string>();

  for (const field of MIS_STANDARD_FIELDS) {
    let matchedHeader = '';

    // Pass 1: exact match with label or aliases
    for (const header of sourceHeaders) {
      if (usedSourceHeaders.has(header)) continue;
      const cleanH = cleanHeaderString(header);
      const isExactLabel = cleanH === cleanHeaderString(field.label);
      const isAliasMatch = field.aliases.some((a) => cleanH === a.toLowerCase());

      if (isExactLabel || isAliasMatch) {
        matchedHeader = header;
        break;
      }
    }

    // Pass 2: substring match if not matched
    if (!matchedHeader) {
      for (const header of sourceHeaders) {
        if (usedSourceHeaders.has(header)) continue;
        const cleanH = cleanHeaderString(header);
        const containsAlias = field.aliases.some((a) => cleanH.includes(a.toLowerCase()) || a.toLowerCase().includes(cleanH));
        if (containsAlias) {
          matchedHeader = header;
          break;
        }
      }
    }

    if (matchedHeader) {
      mapping[field.key] = matchedHeader;
      usedSourceHeaders.add(matchedHeader);
    }
  }

  return mapping;
}
