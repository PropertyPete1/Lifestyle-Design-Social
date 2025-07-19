import { isCartoonVideo } from '../utils/isCartoonVideo'
import { isRealEstateVideo } from '../utils/isRealEstateVideo'

export function alternateContent(files: string[]): string[] {
  const cartoon = files.filter(isCartoonVideo)
  const real = files.filter(isRealEstateVideo)

  const output: string[] = []
  const max = Math.max(cartoon.length, real.length)

  for (let i = 0; i < max; i++) {
    if (real[i]) output.push(real[i])
    if (cartoon[i]) output.push(cartoon[i])
  }

  return output
} 