export const calculateGrade = (percentage, gradingScale) => {
  if (Array.isArray(gradingScale) && gradingScale.length > 0) {
    const match = gradingScale.find((g) => percentage >= g.minPercent && percentage <= g.maxPercent);
    if (match) return match.grade;
  }
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 33) return 'D';
  return 'F';
};
