import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChatList from '../components/communication/ChatList';
import ChatWindow from '../components/communication/ChatWindow';
import PrivateChat from '../components/communication/PrivateChat';
import GroupChat from '../components/communication/GroupChat';
import BroadcastMessage from '../components/communication/BroadcastMessage';
import FileSharing from '../components/communication/FileSharing';

const CommunicationPage = () => {
  return (
    <Routes>
      <Route index element={<ChatList />} />
      <Route path=":id" element={<ChatWindow />} />
      <Route path="new/private" element={<PrivateChat />} />
      <Route path="new/group" element={<GroupChat />} />
      <Route path="broadcast" element={<BroadcastMessage />} />
      <Route path="files" element={<FileSharing />} />
    </Routes>
  );
};

export default CommunicationPage;