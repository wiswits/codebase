import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import BookCopies from "./pages/BookCopies";
import IssueRegister from "./pages/IssueRegister";
import MyBooks from "./pages/MyBooks";
import Statistics from "./pages/Statistics";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { loading, currentUser } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading EduSuite Library...</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center px-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">No demo users found</h1>
          <p className="text-gray-500 mt-2 max-w-md">
            Run <code className="bg-gray-100 px-1.5 py-0.5 rounded">npm run seed</code> in the backend folder to
            create sample users, books, and issue records, then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/copies" element={<BookCopies />} />
          <Route path="/issue-register" element={<IssueRegister />} />
          <Route path="/my-books" element={<MyBooks />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </div>
    </div>
  );
}
