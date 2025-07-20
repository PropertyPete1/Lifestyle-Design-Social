import fs from 'fs';

export interface CsvVideoEntry {
  filename: string;
  caption: string;
  postTime: string;
}

export function parseCSVFile(filePath: string): Promise<CsvVideoEntry[]> {
  return new Promise((resolve, reject) => {
    const results: CsvVideoEntry[] = [];

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const lines = data.split('\n');
        const headers = lines[0]?.split(',').map(h => h.trim()) || [];
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          if (row.filename && row.caption && row.postTime) {
            results.push({
              filename: row.filename,
              caption: row.caption,
              postTime: row.postTime,
            });
          }
        }

        resolve(results);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

export function validateCsvData(entries: CsvVideoEntry[]): {
  valid: CsvVideoEntry[];
  invalid: Array<{ entry: CsvVideoEntry; reason: string }>;
} {
  const valid: CsvVideoEntry[] = [];
  const invalid: Array<{ entry: CsvVideoEntry; reason: string }> = [];

  entries.forEach((entry, index) => {
    const errors: string[] = [];

    if (!entry.filename) errors.push('Missing filename');
    if (!entry.caption) errors.push('Missing caption');
    if (!entry.postTime) errors.push('Missing post time');

    // Validate post time format (expecting ISO string or date format)
    if (entry.postTime && isNaN(Date.parse(entry.postTime))) {
      errors.push('Invalid post time format');
    }

    if (errors.length > 0) {
      invalid.push({
        entry,
        reason: errors.join(', ')
      });
    } else {
      valid.push(entry);
    }
  });

  return { valid, invalid };
}

export function generateCsvTemplate(): string {
  return 'filename,caption,postTime\n' +
         'video1.mp4,Amazing property tour!,2024-01-15T10:00:00Z\n' +
         'video2.mp4,Check out this stunning home,2024-01-16T14:30:00Z\n' +
         'video3.mp4,Open house this weekend!,2024-01-17T19:00:00Z';
} 