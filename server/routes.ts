import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import path from "path";

function executePythonScript(scriptPath: string, inputData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [scriptPath], {
      env: process.env  // ✅ FIXED: Pass environment variables
    });
    
    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        console.error("Python script error:", stderr);
        reject(new Error(`Python script failed: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (e) {
          console.error("Failed to parse Python output:", stdout);
          reject(new Error(`Failed to parse Python output: ${e}`));
        }
      }
    });

    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Match scholarships endpoint
  app.post("/api/match-scholarships", async (req, res) => {
    try {
      const { studentProfile } = req.body;
      
      if (!studentProfile) {
        return res.status(400).json({ error: "Student profile is required" });
      }

      const scriptPath = path.join(process.cwd(), "python_backend", "scholarship_matcher.py");
      const result = await executePythonScript(scriptPath, { studentProfile });
      
      res.json(result);
    } catch (error) {
      console.error("Error matching scholarships:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to match scholarships" });
    }
  });

  // Generate essay endpoint
  app.post("/api/generate-essay", async (req, res) => {
    try {
      const { scholarshipDescription, studentProfile } = req.body;
      
      if (!scholarshipDescription || !studentProfile) {
        return res.status(400).json({ error: "Scholarship description and student profile are required" });
      }

      // Extract scholarship name from description (first line or first 50 chars)
      const scholarshipName = scholarshipDescription.split("\n")[0].substring(0, 100);
      
      const scriptPath = path.join(process.cwd(), "python_backend", "essay_generator.py");
      const result = await executePythonScript(scriptPath, {
        scholarshipDescription,
        studentProfile,
        scholarshipName
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating essay:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate essay" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
