import Papa from 'papaparse';

export interface ProblemMapping {
  text: string;
  url: string;
}

let problemMappings: Map<string, string> | null = null;

export async function loadProblemMappings(): Promise<Map<string, string>> {
  if (problemMappings) {
    return problemMappings;
  }

  try {
    const response = await fetch('/problems.csv');
    const csvText = await response.text();
    
    const results = Papa.parse<ProblemMapping>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    problemMappings = new Map();
    results.data.forEach((row) => {
      if (row.text && row.url) {
        problemMappings!.set(row.text.trim(), row.url.trim());
      }
    });

    return problemMappings;
  } catch (error) {
    console.error('Failed to load problem mappings:', error);
    return new Map();
  }
}

export function getPRUrlForArgument(argumentText: string): string | null {
  if (!problemMappings) {
    return null;
  }
  return problemMappings.get(argumentText.trim()) || null;
}
