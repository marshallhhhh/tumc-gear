import {
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { GearTagFront, GearTagBack } from "../features/tags/GearTag";
import NumberSpinner from "../components/NumberSpinner";

const TAGS_PER_PAGE = 9;

export default function PrintTags() {
  const [pageCount, setPageCount] = useState(1);
  const [doubleSided, setDoubleSided] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const handlePageCountChange = (value) => {
    if (value === "" || value === null || value === undefined) {
      setPageCount("");
      return;
    }

    const raw = Number(value);
    if (!Number.isNaN(raw) && raw > 0) {
      setPageCount(raw);
      return;
    }

    setPageCount(0);
  };

  const handleDoubleSidedChange = (event) => {
    setDoubleSided(event.target.checked);
  };

  const pages = Array.from(
    { length: typeof pageCount === "number" ? pageCount : 0 },
    () => TAGS_PER_PAGE,
  );

  const renderPage = (tagsOnPage, TagComponent) => (
    <Grid container columnSpacing={1} rowSpacing={2}>
      {Array.from({ length: tagsOnPage }, (_, index) => (
        <Grid
          key={index}
          size={4}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TagComponent />
        </Grid>
      ))}
    </Grid>
  );
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

          .no-print { display: none !important; }
        }
      `}</style>

      <Container maxWidth="md" sx={{ mt: 4 }} className="no-print">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <NumberSpinner
            label="Number of pages"
            min={1}
            max={30}
            value={pageCount}
            onValueChange={(value) => handlePageCountChange(value)}
            defaultValue={1}
            sx={{ height: 56 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={doubleSided}
                onChange={handleDoubleSidedChange}
              />
            }
            label="Double sided"
          />
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={pageCount <= 0}
          >
            Print
          </Button>
        </Stack>
      </Container>

      <Container maxWidth="md" sx={{ mt: 4, boxShadow: 2, paddingY: 4 }}>
        <div className="print-only">
          {/* FRONT */}
          {pages.map((tagsOnPage, i) => (
            <div className="print-page" key={`front-page-${i}`}>
              {renderPage(tagsOnPage, GearTagFront)}
            </div>
          ))}

          {/* BACK */}
          {doubleSided &&
            pages.map((tagsOnPage, i) => (
              <div className="print-page" key={`back-page-${i}`}>
                {renderPage(tagsOnPage, GearTagBack)}
              </div>
            ))}
        </div>
      </Container>
    </div>
  );
}
