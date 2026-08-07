require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Book = require("../models/Book");
const BookCopy = require("../models/BookCopy");
const IssueRecord = require("../models/IssueRecord");

const ORG_ID = "demo-school";

async function seed() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({ orgId: ORG_ID }),
    Book.deleteMany({ orgId: ORG_ID }),
    BookCopy.deleteMany({ orgId: ORG_ID }),
    IssueRecord.deleteMany({ orgId: ORG_ID }),
  ]);

  console.log("Creating demo users...");
  const admin = await User.create({ orgId: ORG_ID, name: "Jatin Choudhary", role: "admin", email: "admin@wiswits.demo" });
  const teacher = await User.create({ orgId: ORG_ID, name: "Meera Nair", role: "teacher", email: "teacher@wiswits.demo" });

  const students = await User.insertMany([
    { orgId: ORG_ID, name: "Rahul Verma", role: "student", studentCode: "STU-1001" },
    { orgId: ORG_ID, name: "Ananya Sharma", role: "student", studentCode: "STU-1002" },
    { orgId: ORG_ID, name: "Karan Singh", role: "student", studentCode: "STU-1003" },
    { orgId: ORG_ID, name: "Sneha Patel", role: "student", studentCode: "STU-1004" },
    { orgId: ORG_ID, name: "Aman Yadav", role: "student", studentCode: "STU-1005" },
  ]);

  const parent = await User.create({
    orgId: ORG_ID,
    name: "Suresh Verma",
    role: "parent",
    linkedStudentId: students[0]._id,
    email: "parent@wiswits.demo",
  });

  console.log("Creating books...");
  const bookDefs = [
    { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", coverEmoji: "📕", copies: 4 },
    { title: "Atomic Habits", author: "James Clear", category: "Reference", coverEmoji: "📗", copies: 5 },
    { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", category: "Reference", coverEmoji: "📘", copies: 3 },
    { title: "Wings of Fire", author: "A. P. J. Abdul Kalam", category: "Academic", coverEmoji: "📙", copies: 3 },
    { title: "Think and Grow Rich", author: "Napoleon Hill", category: "Reference", coverEmoji: "📓", copies: 2 },
    { title: "The 5 AM Club", author: "Robin Sharma", category: "Fiction", coverEmoji: "📕", copies: 3 },
    { title: "Deep Work", author: "Cal Newport", category: "Academic", coverEmoji: "📘", copies: 2 },
    { title: "The Power of Habit", author: "Charles Duhigg", category: "Science", coverEmoji: "📙", copies: 2 },
    { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", coverEmoji: "📗", copies: 3 },
    { title: "Sapiens", author: "Yuval Noah Harari", category: "Academic", coverEmoji: "📘", copies: 4 },
  ];

  const books = [];
  for (const def of bookDefs) {
    const book = await Book.create({
      orgId: ORG_ID,
      title: def.title,
      author: def.author,
      category: def.category,
      coverEmoji: def.coverEmoji,
      totalCopies: def.copies,
      isbn: "978" + Math.floor(1000000000 + Math.random() * 8999999999),
    });
    books.push({ book, copies: def.copies });
  }

  console.log("Creating physical copies...");
  const allCopies = [];
  let barcodeCounter = 1;
  for (const { book, copies } of books) {
    for (let i = 0; i < copies; i++) {
      const copy = await BookCopy.create({
        orgId: ORG_ID,
        bookId: book._id,
        barcode: `BC-${String(barcodeCounter).padStart(5, "0")}`,
        status: "Available",
      });
      barcodeCounter++;
      allCopies.push({ copy, bookTitle: book.title });
    }
  }

  console.log("Creating issue records (matching dashboard demo state)...");
  const findBook = (title) => books.find((b) => b.book.title === title).book;
  const findCopy = (title) => allCopies.find((c) => c.bookTitle === title).copy;

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const issueRecordsDefs = [
    { title: "The Alchemist", student: students[0], issueDate: daysAgo(2), dueDate: daysFromNow(8), status: "Issued" },
    { title: "Atomic Habits", student: students[1], issueDate: daysAgo(3), dueDate: daysFromNow(7), status: "Issued" },
    { title: "Rich Dad Poor Dad", student: students[2], issueDate: daysAgo(4), dueDate: daysAgo(1), status: "Issued" }, // overdue
    { title: "Wings of Fire", student: students[3], issueDate: daysAgo(5), dueDate: daysAgo(3), status: "Returned", returnDate: daysAgo(2) },
    { title: "Think and Grow Rich", student: students[4], issueDate: daysAgo(6), dueDate: daysAgo(4), status: "Returned", returnDate: daysAgo(3) },
    { title: "The 5 AM Club", student: students[0], issueDate: daysAgo(10), dueDate: daysAgo(5), status: "Issued" }, // overdue 5d
    { title: "Deep Work", student: students[1], issueDate: daysAgo(9), dueDate: daysAgo(4), status: "Issued" }, // overdue 4d
    { title: "The Power of Habit", student: students[2], issueDate: daysAgo(8), dueDate: daysAgo(3), status: "Issued" }, // overdue 3d... adjusted below
  ];

  for (const def of issueRecordsDefs) {
    const book = findBook(def.title);
    const copy = findCopy(def.title);
    const record = await IssueRecord.create({
      orgId: ORG_ID,
      bookId: book._id,
      copyId: copy._id,
      userId: def.student._id,
      issueDate: def.issueDate,
      dueDate: def.dueDate,
      returnDate: def.returnDate || null,
      status: def.status,
      fineAmount: def.status === "Returned" && def.returnDate > def.dueDate
        ? Math.ceil((def.returnDate - def.dueDate) / (1000 * 60 * 60 * 24)) * (Number(process.env.FINE_PER_DAY) || 2)
        : 0,
      issuedBy: teacher._id,
    });
    if (def.status === "Issued") {
      copy.status = "Issued";
      await copy.save();
    }
  }

  console.log("\nSeed complete!");
  console.log("Demo users you can log in as (use their _id as x-user-id header):");
  console.log(`  Admin:   ${admin.name} (${admin._id})`);
  console.log(`  Teacher: ${teacher.name} (${teacher._id})`);
  students.forEach((s) => console.log(`  Student: ${s.name} / ${s.studentCode} (${s._id})`));
  console.log(`  Parent:  ${parent.name} - linked to ${students[0].name} (${parent._id})`);
  console.log("\nThe frontend's role switcher fetches these automatically from GET /api/users/demo-users.");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
