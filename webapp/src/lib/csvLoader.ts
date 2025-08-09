import argIdMappingsData from '@/data/argIdMappings.json';

let argIdMappings: Map<string, string> | null = null;

export async function loadProblemMappings(): Promise<Map<string, string>> {
  if (argIdMappings) {
    return argIdMappings;
  }

  try {
    argIdMappings = new Map();
    
    Object.entries(argIdMappingsData).forEach(([argId, url]) => {
      const cleanArgId = argId.trim();
      const cleanUrl = url.trim();
      argIdMappings!.set(cleanArgId, cleanUrl);
    });

    console.log(`Loaded ${argIdMappings.size} arg_id to PR URL mappings`);
    return argIdMappings;
  } catch (error) {
    console.error('Failed to load arg_id mappings:', error);
    return new Map();
  }
}

export function getPRUrlForArgument(argumentText: string, argId?: string): string | null {
  if (!argIdMappings) {
    return null;
  }
  
  if (argId) {
    const url = argIdMappings.get(argId);
    if (url) {
      return url;
    }
  }
  
  console.log(`No mapping found for arg_id: "${argId}"`);
  return null;
}
