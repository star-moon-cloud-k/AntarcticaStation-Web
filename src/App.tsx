import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './page/Home';
import Room from './page/Room';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/"  Component={Home} />
        <Route path="/room/:roomId" Component={Room} />
      </Routes>
    </Router>
  );
};

export default App;
