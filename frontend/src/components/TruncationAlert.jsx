import { Alert } from "@mui/material";
import { MAX_FETCH_ALL_ROWS } from "../utils/fetchAllPages";

/**
 * Shown when a list exceeded the fetch-all ceiling, so it is clear that sorting,
 * filtering and counts only cover the records actually loaded.
 */
export default function TruncationAlert({ totalCount }) {
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      Showing the first {MAX_FETCH_ALL_ROWS.toLocaleString()} of{" "}
      {totalCount.toLocaleString()} records. Search and filters apply only to
      these.
    </Alert>
  );
}
