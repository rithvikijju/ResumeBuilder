"use client";

import { useState } from "react";

type PdfExportButtonProps = {
  resumeId: string;
  latexSource: string;
  filename: string;
};

export function PdfExportButton({ resumeId, latexSource, filename }: PdfExportButtonProps) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClientExport = async () => {
    setIsCompiling(true);
    setError(null);

    try {
      // Try server-side compilation first (more reliable for complex LaTeX)
      const response = await fetch(`/dashboard/resumes/${resumeId}/export-pdf`);
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        
        if (contentType?.includes("pdf")) {
          // Successfully got PDF from server
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename.replace(/[^a-z0-9]/gi, "_")}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        } else {
          // Server returned LaTeX file (compilation failed)
          const text = await response.text();
          
          // Try client-side compilation as fallback
          try {
            const { parse } = await import("latex.js");
            const { jsPDF } = await import("jspdf");
            
            // Parse LaTeX to HTML
            const generator = new parse(text);
            const html = generator.htmlDocument();
            
            // Create a temporary container to render HTML
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "8.5in";
            tempDiv.innerHTML = html;
            document.body.appendChild(tempDiv);
            
            // Initialize jsPDF
            const doc = new jsPDF({
              unit: "in",
              format: "letter",
            });
            
            // Convert HTML to PDF
            await doc.html(tempDiv, {
              callback: (doc) => {
                // Clean up
                document.body.removeChild(tempDiv);
                
                // Save the PDF
                doc.save(`${filename.replace(/[^a-z0-9]/gi, "_")}.pdf`);
              },
              x: 0.5,
              y: 0.5,
              width: 7.5,
              windowWidth: 612,
            });
            return;
          } catch (clientErr) {
            // Client-side also failed, download LaTeX file
            console.error("Client-side compilation also failed:", clientErr);
            const blob = new Blob([text], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${filename.replace(/[^a-z0-9]/gi, "_")}.tex`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setError("Compilation failed. LaTeX file downloaded. Please compile manually using Overleaf.");
            return;
          }
        }
      }
      
      throw new Error("Server request failed");
    } catch (err) {
      console.error("PDF export failed:", err);
      setError("Export failed. Please try again.");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClientExport}
        disabled={isCompiling}
        className="inline-flex items-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCompiling ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Compiling...
          </>
        ) : (
          "Export PDF"
        )}
      </button>
      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">{error}</p>
      )}
    </div>
  );
}

