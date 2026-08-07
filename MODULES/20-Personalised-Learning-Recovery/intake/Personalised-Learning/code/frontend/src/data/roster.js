/* Local demo roster generator — mirrors the backend fixtures' name logic so the
   marks-entry screen is self-contained. Student ids match seeded ids (900001+). */

const FIRST = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Kabir', 'Meera', 'Vivaan', 'Anaya', 'Arjun', 'Diya', 'Ishaan', 'Kiara', 'Reyansh', 'Aadhya', 'Vihaan', 'Saanvi', 'Krishna', 'Myra', 'Dhruv', 'Aarohi'];
const LAST = ['Sharma', 'Singh', 'Verma', 'Patel', 'Shah', 'Joshi', 'Gupta', 'Nair', 'Reddy', 'Iyer', 'Mehta', 'Rao', 'Das', 'Kapoor', 'Bose'];

export function roster(n = 32) {
  return Array.from({ length: n }, (_, i) => {
    const id = 900001 + i;
    return {
      student_id: id,
      roll: 1042 + i,
      name: `${FIRST[id % FIRST.length]} ${LAST[Math.floor(id / FIRST.length) % LAST.length]}`,
    };
  });
}

export const SAMPLE_MAP = [
  { paper_q_no: 1, wiswits_id: 'MATH10C01T02', difficulty: 'easy', marks: 2 },
  { paper_q_no: 2, wiswits_id: 'MATH10C01T03', difficulty: 'medium', marks: 2 },
  { paper_q_no: 3, wiswits_id: 'MATH10C03T01', difficulty: 'hard', marks: 2 },
  { paper_q_no: 4, wiswits_id: 'MATH10C03T02', difficulty: 'medium', marks: 2 },
  { paper_q_no: 5, wiswits_id: 'MATH10C05T01', difficulty: 'easy', marks: 2 },
  { paper_q_no: 6, wiswits_id: 'MATH10C05T02', difficulty: 'medium', marks: 2 },
  { paper_q_no: 7, wiswits_id: 'MATH10C07T01', difficulty: 'hard', marks: 2 },
  { paper_q_no: 8, wiswits_id: 'MATH10C01T02', difficulty: 'medium', marks: 2 },
  { paper_q_no: 9, wiswits_id: 'MATH10C03T02', difficulty: 'hard', marks: 2 },
  { paper_q_no: 10, wiswits_id: 'MATH10C07T01', difficulty: 'extreme', marks: 2 },
];
