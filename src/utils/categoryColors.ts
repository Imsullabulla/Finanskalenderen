import type { Category } from '@/data/obligations';

export function getCategoryColor(category: Category | string): string {
    switch (category) {
        case 'skat':     return '#a2d2ff';
        case 'miljø':    return '#b5ead7';
        case 'eu':       return '#bde0fe';
        case 'afgifter': return '#ffafcc';
        case 'hr':       return '#ffc8dd';
        case 'regnskab': return '#cdb4db';
        default:         return '#e2e8f0';
    }
}
