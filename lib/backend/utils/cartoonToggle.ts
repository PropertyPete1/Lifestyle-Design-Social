let lastWasCartoon = false

export async function getNextCartoonToggle() {
  lastWasCartoon = !lastWasCartoon
  return { shouldUseCartoon: lastWasCartoon }
} 