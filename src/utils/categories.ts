import { CategoryMappingRule } from '../types';

export const STANDARD_CATEGORIES = [
  'Grooming',
  'OPD consultation',
  'IPD Admissions',
  'Surgery',
  'Lab & Investigation',
] as const;

export const DEFAULT_CATEGORY_RULES: CategoryMappingRule[] = [
  { id: 'cat-1', pattern: 'grooming', targetCategory: 'Grooming' },
  { id: 'cat-2', pattern: 'bath', targetCategory: 'Grooming' },
  { id: 'cat-3', pattern: 'spa', targetCategory: 'Grooming' },
  { id: 'cat-4', pattern: 'haircut', targetCategory: 'Grooming' },

  { id: 'cat-5', pattern: 'opd consultation', targetCategory: 'OPD consultation' },
  { id: 'cat-6', pattern: 'opd', targetCategory: 'OPD consultation' },
  { id: 'cat-7', pattern: 'consultation', targetCategory: 'OPD consultation' },
  { id: 'cat-8', pattern: 'consult', targetCategory: 'OPD consultation' },
  { id: 'cat-9', pattern: 'outpatient', targetCategory: 'OPD consultation' },
  { id: 'cat-10', pattern: 'vaccination', targetCategory: 'OPD consultation' },
  { id: 'cat-11', pattern: 'checkup', targetCategory: 'OPD consultation' },

  { id: 'cat-12', pattern: 'ipd admissions', targetCategory: 'IPD Admissions' },
  { id: 'cat-13', pattern: 'ipd', targetCategory: 'IPD Admissions' },
  { id: 'cat-14', pattern: 'admission', targetCategory: 'IPD Admissions' },
  { id: 'cat-15', pattern: 'boarding', targetCategory: 'IPD Admissions' },
  { id: 'cat-16', pattern: 'hospitalization', targetCategory: 'IPD Admissions' },
  { id: 'cat-17', pattern: 'inpatient', targetCategory: 'IPD Admissions' },

  { id: 'cat-18', pattern: 'surgery', targetCategory: 'Surgery' },
  { id: 'cat-19', pattern: 'surgical', targetCategory: 'Surgery' },
  { id: 'cat-20', pattern: 'operation', targetCategory: 'Surgery' },
  { id: 'cat-21', pattern: 'dental surgery', targetCategory: 'Surgery' },
  { id: 'cat-22', pattern: 'spay', targetCategory: 'Surgery' },
  { id: 'cat-23', pattern: 'neuter', targetCategory: 'Surgery' },

  { id: 'cat-24', pattern: 'lab & investigation', targetCategory: 'Lab & Investigation' },
  { id: 'cat-25', pattern: 'lab and investigation', targetCategory: 'Lab & Investigation' },
  { id: 'cat-26', pattern: 'lab', targetCategory: 'Lab & Investigation' },
  { id: 'cat-27', pattern: 'laboratory', targetCategory: 'Lab & Investigation' },
  { id: 'cat-28', pattern: 'diagnostics', targetCategory: 'Lab & Investigation' },
  { id: 'cat-29', pattern: 'pathology', targetCategory: 'Lab & Investigation' },
  { id: 'cat-30', pattern: 'investigation', targetCategory: 'Lab & Investigation' },
  { id: 'cat-31', pattern: 'x-ray', targetCategory: 'Lab & Investigation' },
  { id: 'cat-32', pattern: 'radiology', targetCategory: 'Lab & Investigation' },
  { id: 'cat-33', pattern: 'ultrasound', targetCategory: 'Lab & Investigation' },
  { id: 'cat-34', pattern: 'blood test', targetCategory: 'Lab & Investigation' },
];

export function mapCategory(
  rawCategory: string,
  rules: CategoryMappingRule[] = DEFAULT_CATEGORY_RULES
): { mappedCategory: string; needsReview: boolean } {
  if (!rawCategory || !rawCategory.trim()) {
    return { mappedCategory: 'Uncategorized', needsReview: true };
  }

  const clean = rawCategory.trim().toLowerCase();

  // 1. Direct standard match
  for (const std of STANDARD_CATEGORIES) {
    if (clean === std.toLowerCase()) {
      return { mappedCategory: std, needsReview: false };
    }
  }

  // 2. Rule matching
  for (const rule of rules) {
    const pat = rule.pattern.toLowerCase().trim();
    if (clean === pat || clean.includes(pat)) {
      return { mappedCategory: rule.targetCategory, needsReview: false };
    }
  }

  // 3. Not confident - retain original value and flag as Needs Review!
  return { mappedCategory: rawCategory.trim(), needsReview: true };
}
