import { Box, Grid, Card, CardContent, Skeleton, Stack } from "@mui/material";

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

export function CardsSkeleton({
  count = 6,
  gridSize = { xs: 6, sm: 6, md: 4 },
  useGrid = true,
}) {
  const content = Array.from({ length: count }).map((_, i) => {
    const card = (
      <Card key={i} sx={{ height: "100%" }}>
        <CardContent>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            gap={2}
            justifyContent="center"
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width={60} height={40} />
          </Box>
          <Skeleton
            variant="text"
            width="80%"
            height={24}
            sx={{ mt: 2, mx: "auto" }}
          />
        </CardContent>
      </Card>
    );

    return useGrid ? (
      <Grid key={i} size={gridSize}>
        {card}
      </Grid>
    ) : (
      <Box key={i} sx={{ width: 180, borderRadius: 1 }}>
        {card}
      </Box>
    );
  });

  return useGrid ? (
    <Grid container spacing={2} aria-busy="true">
      {content}
    </Grid>
  ) : (
    <Box display="flex" flexWrap="wrap" gap={2} aria-busy="true">
      {content}
    </Box>
  );
}
