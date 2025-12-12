/**
 * Application Entry Point
 * 
 * Initializes the React application and mounts it to the DOM.
 * This is the first file executed when the application loads.
 * 
 * @module main
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Mount the application to the root DOM element.
 * Uses React 18's createRoot API for concurrent features.
 */
createRoot(document.getElementById("root")!).render(<App />);