import {
  Button,
  Checkbox,
  Container,
  FormLabel,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { useMemo, useState } from "react";
import { GearTagFront, GearTagBack } from "../features/tags/GearTag";
import NumberSpinner from "../components/NumberSpinner";
import { getTagLayoutForPage } from "../features/tags/printTagsLayout";

export default function PrintTags() {
  const [pageCount, setPageCount] = useState(1);
  const [doubleSided, setDoubleSided] = useState(true);
  const [tagSize, setTagSize] = useState("sm");

  const layout = useMemo(() => getTagLayoutForPage(tagSize), [tagSize]);
  const safePageCount = typeof pageCount === "number" ? pageCount : 0;

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

  const handleTagSizeChange = (event) => {
    setTagSize(event.target.value);
  };

  const pages = Array.from({ length: safePageCount }, () => layout.tagsPerPage);

  const renderPage = (tagsOnPage, TagComponent) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
        gap: `${layout.gapMm}mm`,
        width: "100%",
        height: "100%",
        alignContent: "start",
      }}
    >
      {Array.from({ length: tagsOnPage }, (_, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TagComponent size={tagSize} />
        </div>
      ))}
    </div>
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
            justify-content: flex-start;
            align-items: flex-start;
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

      <Container
        maxWidth="md"
        sx={{ mt: 4, display: "flex", flexDirection: "column" }}
        className="no-print"
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-end"
          flexWrap="wrap"
        >
          <NumberSpinner
            label="Number of pages"
            min={1}
            max={30}
            value={pageCount}
            onValueChange={(value) => handlePageCountChange(value)}
            defaultValue={1}
          />
          <FormControl size="md" sx={{ minWidth: 150 }}>
            <FormLabel
              sx={{
                display: "inline-block",
                fontSize: "0.875rem",
                color: "text.primary",
                fontWeight: 500,
                lineHeight: 1.5,
                mb: 0.5,
              }}
            >
              Tag size
            </FormLabel>
            <Select
              labelId="tag-size-label"
              value={tagSize}
              onChange={handleTagSizeChange}
            >
              <MenuItem value="sm">Small</MenuItem>
              <MenuItem value="md">Medium</MenuItem>
              <MenuItem value="lg">Large</MenuItem>
            </Select>
          </FormControl>
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
            disabled={safePageCount <= 0}
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
