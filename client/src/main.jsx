
//////////////////////////////////////////////////////
// main.jsx
// Description : Main entry point of CodeMaster
// Author      : Your Name
// Date        : 23/11/2026
//////////////////////////////////////////////////////

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./App.css";
import "./index.css";
import "./workspace.css";

// Render the main application inside the root element.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>
);
