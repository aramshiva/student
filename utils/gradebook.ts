export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
    case 'A+':
    case 'A-':
      return 'text-green-600 bg-green-100';
    case 'B':
    case 'B+':
    case 'B-':
      return 'text-blue-600 bg-blue-100';
    case 'C':
    case 'C+':
    case 'C-':
      return 'text-yellow-600 bg-yellow-100';
    case 'D':
    case 'D+':
    case 'D-':
      return 'text-orange-600 bg-orange-100';
    case 'F':
      return 'text-red-600 bg-red-100';
    case 'E':
      return 'text-red-600 bg-red-100';
    case 'P':
      return 'text-green-600 bg-green-100';

    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getCourseIcon(imageType: string): string {
  switch (imageType.toLowerCase()) {
    case 'math':
      return '📊';
    case 'science':
      return '🔬';
    case 'social':
      return '🌍';
    case 'phyeducation':
      return '⚽';
    case 'english':
      return '📚';
    case 'art':
      return '🎨';
    case 'music':
      return '🎵';
    case 'foreign language':
      return '🌐';
    default:
      return '📖';
  }
}

export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}
