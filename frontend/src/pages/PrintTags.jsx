import { Button, Grid } from "@mui/material";
import { GearTagFront, GearTagBack } from "../features/tags/GearTag";

export default function PrintTags() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
    <style>{`
      .print-only, .print-only * {
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      @media print {
        @page { size: A4; margin: 0; }
        html, body {
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 297mm;
        }

        * { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }

        /* hide everything except our print-only container */
        body * { visibility: hidden; }
        .print-only, .print-only * { visibility: visible; }

        .print-only {
          position: absolute;
          top: 0;
          left: 0;
          margin: 0;
          padding: 0;
          width: 210mm;
        }

        /* each page sized to A4 */
        .print-page {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          padding: 10mm;
          margin: 0;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .print-page + .print-page {
          break-before: page;
          page-break-before: always;
        }

        .print-page:last-child {
          break-after: avoid;
          page-break-after: avoid;
        }
      }
    `}</style>

      <Button
        variant="contained"
        onClick={handlePrint}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        Print
      </Button>

      <div className="print-only">
        {/* FRONT */}
        <div className="print-page">
          <Grid container columnSpacing={1} rowSpacing={2}>
            {Array.from({ length: 9 }, (_, index) => (
              <Grid
                key={index}
                size={4}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <GearTagFront />
              </Grid>
            ))}
          </Grid>
        </div>

        {/* BACK */}
        <div className="print-page" >
          <Grid container columnSpacing={1} rowSpacing={2}>
            {Array.from({ length: 9 }, (_, index) => (
              <Grid
                key={index}
                size={4}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <GearTagBack />
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </div>
  );
}
