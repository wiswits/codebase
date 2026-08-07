/**
 * Alumni Dashboard Mock Data
 * Matches the API contract response structure
 */

export const mockDashboardStats = {
  totalAlumni: 2456,
  activeAlumni: 1890,
  recentGraduates: 342,
  topBatches: [
    { batch: "2024", count: 156 },
    { batch: "2023", count: 142 },
    { batch: "2022", count: 138 },
    { batch: "2021", count: 125 },
    { batch: "2020", count: 118 }
  ],
  recentAlumni: [
    {
      id: 1,
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@example.com",
      phone: "9876543210",
      batch: "2024",
      graduationYear: 2024,
      course: "Science",
      status: "active"
    },
    {
      id: 2,
      firstName: "Aarav",
      lastName: "Verma",
      email: "aarav.verma@example.com",
      phone: "9876543211",
      batch: "2024",
      graduationYear: 2024,
      course: "Commerce",
      status: "active"
    },
    {
      id: 3,
      firstName: "Neha",
      lastName: "Patel",
      email: "neha.patel@example.com",
      phone: "9876543212",
      batch: "2023",
      graduationYear: 2023,
      course: "Science",
      status: "active"
    },
    {
      id: 4,
      firstName: "Rahul",
      lastName: "Singh",
      email: "rahul.singh@example.com",
      phone: "9876543213",
      batch: "2023",
      graduationYear: 2023,
      course: "Arts",
      status: "inactive"
    },
    {
      id: 5,
      firstName: "Sneha",
      lastName: "Reddy",
      email: "sneha.reddy@example.com",
      phone: "9876543214",
      batch: "2022",
      graduationYear: 2022,
      course: "Commerce",
      status: "active"
    }
  ]
};