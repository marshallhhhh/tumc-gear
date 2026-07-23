import { Button, Grid } from "@mui/material";
import { GearTagFront, GearTagBack } from "../features/tags/GearTag";

export default function PrintTags() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
    <style>{`
      @media print {
        @page { size: A4; margin: 0; padding: 0; }
        g
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 99%;
        }

        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

        /* hide everything except our print-only container */
        body * { visibility: hidden; }
        .print-only, .print-only * { visibility: visible; }

        .print-only {
          margin: 0;
          padding: 0;
          width: 100%;
        }

        /* each page sized to A4 */
        .print-page {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          padding: 10mm;
          margin: 0;
          overflow: hidden;
          page-break-after: avoid;
          page-break-inside: avoid;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .print-page:last-child {
          page-break-after: auto;
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
        <div
          className="print-page"
          style={{
            width: "210mm",
            height: "297mm",
            padding: "10mm",
            boxSizing: "border-box",
          }}
        >
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
        <div
          className="print-page"
          style={{
            width: "210mm",
            height: "297mm",
            padding: "10mm",
            boxSizing: "border-box",
          }}
        >
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
