import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentList from '../components/documents/DocumentList';
import UploadDocument from '../components/documents/UploadDocument';
import DocumentCategories from '../components/documents/DocumentCategories';
import PolicyDocuments from '../components/documents/PolicyDocuments';
import EmployeeDocuments from '../components/documents/EmployeeDocuments';

const DocumentsPage = () => {
  return (
    <Routes>
      <Route index element={<DocumentList />} />
      <Route path="upload" element={<UploadDocument />} />
      <Route path="categories" element={<DocumentCategories />} />
      <Route path="policies" element={<PolicyDocuments />} />
      <Route path="employee/:id" element={<EmployeeDocuments />} />
    </Routes>
  );
};

export default DocumentsPage;