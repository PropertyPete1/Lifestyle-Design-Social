// Import helper utilities to standardize import paths across projects
// This file provides consistent import patterns and path resolution

/**
 * Standardized import paths for shared types
 */
export const SHARED_IMPORT_PATHS = {
  // Core types
  UNIFIED_TYPES: '@autoposting/shared/types/unified',
  USER_TYPES: '@autoposting/shared/types/user',
  VIDEO_TYPES: '@autoposting/shared/types/video',
  POST_TYPES: '@autoposting/shared/types/post',
  DATABASE_TYPES: '@autoposting/shared/types/database',
  
  // Utilities
  CONSTANTS: '@autoposting/shared/utils/constants',
  HELPERS: '@autoposting/shared/utils/helpers',
  FORMATTERS: '@autoposting/shared/utils/formatters',
  VALIDATORS: '@autoposting/shared/utils/validators',
  LOGGER: '@autoposting/shared/utils/logger',
  
  // Components
  COMPONENTS: '@autoposting/shared/components',
  LOADING_SPINNER: '@autoposting/shared/components/LoadingSpinner',
  
  // Configuration
  ENVIRONMENT: '@autoposting/shared/config/environment',
  TSCONFIG_BASE: '@autoposting/shared/config/tsconfig.base.json',
} as const;

/**
 * Type-safe import path validator
 */
export function validateImportPath(path: string): boolean {
  const validPaths = Object.values(SHARED_IMPORT_PATHS);
  return validPaths.includes(path as any);
}

/**
 * Generate import statement for a given type
 */
export function generateImportStatement(
  types: string[],
  path: keyof typeof SHARED_IMPORT_PATHS,
  isTypeOnly: boolean = true
): string {
  const importPath = SHARED_IMPORT_PATHS[path];
  const typePrefix = isTypeOnly ? 'type ' : '';
  const typesString = types.join(', ');
  
  return `import { ${typePrefix}${typesString} } from '${importPath}';`;
}

/**
 * Common import patterns for different project types
 */
export const IMPORT_PATTERNS = {
  // Backend project imports
  BACKEND: {
    TYPES: [
      "import { UnifiedUser, UnifiedVideo, UnifiedPost } from '@autoposting/shared/types/unified';",
      "import { ApiResponse, QueryResult } from '@autoposting/shared/types/unified';",
      "import { logger } from '@autoposting/shared/utils/logger';",
      "import { VALIDATION, API_ENDPOINTS } from '@autoposting/shared/utils/constants';",
    ],
    SERVICES: [
      "import { DatabaseUser, DatabaseVideo, DatabasePost } from '@autoposting/shared/types/database';",
      "import { toUnifiedUser, toUnifiedVideo, toUnifiedPost } from '@autoposting/shared/types/unified';",
    ],
  },
  
  // Frontend project imports
  FRONTEND: {
    COMPONENTS: [
      "import { LoadingSpinner } from '@autoposting/shared/components';",
      "import { UnifiedUser, UnifiedVideo, UnifiedPost } from '@autoposting/shared/types/unified';",
      "import { formatDate, formatFileSize } from '@autoposting/shared/utils/formatters';",
    ],
    PAGES: [
      "import { ApiResponse, PaginatedResponse } from '@autoposting/shared/types/unified';",
      "import { isValidEmail, isValidPassword } from '@autoposting/shared/utils/validators';",
    ],
  },
  
  // Mobile project imports
  MOBILE: {
    SCREENS: [
      "import { UnifiedUser, UnifiedVideo } from '@autoposting/shared/types/unified';",
      "import { formatRelativeTime } from '@autoposting/shared/utils/formatters';",
      "import { debounce } from '@autoposting/shared/utils/helpers';",
    ],
    CONTEXTS: [
      "import { SocialPlatform, PostStatus } from '@autoposting/shared/types/unified';",
      "import { API_ENDPOINTS } from '@autoposting/shared/utils/constants';",
    ],
  },
} as const;

/**
 * Generate import statements for a specific project type
 */
export function generateProjectImports(
  projectType: keyof typeof IMPORT_PATTERNS,
  section: string
): string[] {
  const pattern = IMPORT_PATTERNS[projectType];
  if (!pattern || !(section in pattern)) {
    return [];
  }
  
  return (pattern as any)[section] || [];
}

/**
 * Path resolution helpers for different environments
 */
export const PATH_RESOLVERS = {
  // Resolve relative paths to absolute shared paths
  resolveSharedPath: (relativePath: string): string => {
    if (relativePath.startsWith('@autoposting/shared')) {
      return relativePath;
    }
    
    // Convert relative paths to absolute shared paths
    const pathMappings: Record<string, string> = {
      '../../../packages/shared/src/types/unified': '@autoposting/shared/types/unified',
      '../../../../packages/shared/src/types/unified': '@autoposting/shared/types/unified',
      '../../../packages/shared/src/utils/constants': '@autoposting/shared/utils/constants',
      '../../../../packages/shared/src/utils/constants': '@autoposting/shared/utils/constants',
      '../../../packages/shared/src/components': '@autoposting/shared/components',
      '../../../../packages/shared/src/components': '@autoposting/shared/components',
    };
    
    return pathMappings[relativePath] || relativePath;
  },
  
  // Resolve monorepo paths
  resolveMonorepoPath: (fromPackage: string, _toPackage: string): string => {
    const packageMappings: Record<string, string> = {
      'backend': '../packages/shared',
      'frontend': '../packages/shared',
      'client': '../packages/shared',
      'mobile-app': '../packages/shared',
      'server': '../packages/shared',
      'apps/api': '../../packages/shared',
    };
    
    return packageMappings[fromPackage] || '../packages/shared';
  },
};

/**
 * Validate and fix import paths in a file
 */
export function fixImportPaths(fileContent: string): string {
  let fixed = fileContent;
  
  // Fix relative paths to shared package
  const relativePathRegex = /from\s+['"]([^'"]*packages\/shared[^'"]*)['"]/g;
  fixed = fixed.replace(relativePathRegex, (match, path) => {
    const resolvedPath = PATH_RESOLVERS.resolveSharedPath(path);
    return match.replace(path, resolvedPath);
  });
  
  // Fix long relative paths
  const longRelativeRegex = /from\s+['"](\.\.[\/\\]){3,}[^'"]*['"]/g;
  fixed = fixed.replace(longRelativeRegex, (match) => {
    // This would need more sophisticated logic based on the actual file structure
    return match;
  });
  
  return fixed;
}

/**
 * Export commonly used import statements
 */
export const COMMON_IMPORTS = {
  // Most commonly used unified types
  CORE_TYPES: "import { UnifiedUser, UnifiedVideo, UnifiedPost, ApiResponse } from '@autoposting/shared/types/unified';",
  
  // Most commonly used utilities
  CORE_UTILS: "import { formatDate, formatFileSize, debounce, isValidEmail } from '@autoposting/shared/utils';",
  
  // Most commonly used constants
  CORE_CONSTANTS: "import { API_ENDPOINTS, SOCIAL_PLATFORMS, VIDEO_CONSTRAINTS } from '@autoposting/shared/utils/constants';",
  
  // Most commonly used components
  CORE_COMPONENTS: "import { LoadingSpinner, LoadingPage } from '@autoposting/shared/components';",
} as const; 