import React from 'react';
import ReactDOM from 'react-dom';

const OverlayPortal = ({ children }) => {
  return ReactDOM.createPortal(
    children,
    document.getElementById('overlay-root') 
  );
};

export default OverlayPortal;
