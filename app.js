// Import the express library
import express from "express";
import path from "path";

// Create an Express application
const app = express();

// Define a port number
const port = 3000;

// Set up static file serving
app.use(express.static("public"));

// Set up a route to handle GET requests to the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
