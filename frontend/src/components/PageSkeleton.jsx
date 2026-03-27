import { Box, Skeleton, Stack } from "@mui/material";

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <Box aria-busy="true">
      <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} display="flex" gap={2} sx={{ mb: 1 }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" sx={{ flex: 1 }} height={36} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export function DetailSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true">
      <Skeleton variant="text" width="60%" height={40} />
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="text" width="50%" height={24} />
    </Stack>
  );
}

export function CardsSkeleton({ count = 6 }) {
  return (
    <Box display="flex" flexWrap="wrap" gap={2} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          width={180}
          height={120}
          sx={{ borderRadius: 1 }}
        />
      ))}
    </Box>
  );
}
