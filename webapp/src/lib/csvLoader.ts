import problemMappingsData from '@/data/problemMappings.json';

let problemMappings: Map<string, string> | null = null;

export async function loadProblemMappings(): Promise<Map<string, string>> {
  if (problemMappings) {
    return problemMappings;
  }

  try {
    problemMappings = new Map();
    Object.entries(problemMappingsData).forEach(([text, url]) => {
      problemMappings!.set(text.trim(), url.trim());
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
