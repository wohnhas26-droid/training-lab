import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, 'catalog.json'), 'utf-8'));

export const EXERCISES = data.exercises;
export const WEEKLY_SCHEDULE = data.weeklySchedule;
export const POSITION_FOCUS = data.positionFocus;
export const TRAINING_CATEGORIES = data.categories;
export const CHALLENGES = data.challenges;
export const ACHIEVEMENTS = data.achievements;
export const PROGRESSION_LEVELS = data.levels;

export function getExercisesByCategory(categoryId) {
  return EXERCISES.filter(e => e.category === categoryId);
}

export function getExerciseById(id) {
  return EXERCISES.find(e => e.id === id);
}
