import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Builder from './pages/Builder';
import  PreviewFrame  from './components/PreviewFrame';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/preview" element={<PreviewFrame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;