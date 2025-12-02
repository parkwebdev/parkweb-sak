import React from 'react';
import { createRoot } from 'react-dom/client';
import WidgetPage from './pages/WidgetPage';
// Use minimal widget CSS instead of full index.css
import './widget.css';

createRoot(document.getElementById('root')!).render(<WidgetPage />);
