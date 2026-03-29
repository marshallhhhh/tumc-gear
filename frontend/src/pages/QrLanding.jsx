import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { useResolveQr, useAssignQr } from "../hooks/useQr";
import { useItems } from "../hooks/useItems";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Button,
} from "@mui/material";
import ConfirmDialog from "../components/ConfirmDialog";

export default function QrLanding() {
  const { nanoid } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const resolveQr = useResolveQr();

  const [resolved, setResolved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showAssignUI, setShowAssignUI] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reassignConfirmOpen, setReassignConfirmOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [pendingItemId, setPendingItemId] = useState(null);

  // Items for admin assignment
  const { data: itemsData } = useItems(
    { search: searchTerm, pageSize: 20 },
    { enabled: showAssignUI },
  );

  const assignQr = useAssignQr();

  useEffect(() => {
    if (authLoading || resolved) return;

    resolveQr.mutate(nanoid, {
      onSuccess: (data) => {
        setResolved(true);
        navigate(`/item/${data.shortId}`, { replace: true });
      },
      onError: async (err) => {
        if (err.response?.status === 404) {
          setResolved(true);
          if (isAdmin) {
            setShowAssignUI(true);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      },
    });
  }, [nanoid, authLoading, resolved, isAdmin]);

  const handleAssign = async (itemId) => {
    try {
      await assignQr.mutateAsync({ nanoid, itemId });
      notify("QR tag assigned successfully", "success");
      const item = itemsData?.data?.find((i) => i.id === itemId);
      navigate(`/admin/items/${item?.shortId || ""}`, { replace: true });
    } catch (err) {
      if (
        err.response?.data?.error === "CONFLICT" &&
        err.response?.data?.details?.currentItemId
      ) {
        setPendingItemId(itemId);
        setConflictDetails(err.response.data.details);
        setReassignConfirmOpen(true);
      } else {
        notify(
          err.response?.data?.message ||
            err.message ||
            "Failed to assign QR tag",
          "error",
        );
      }
    }
  };

  const handleReassign = async () => {
    setReassignConfirmOpen(false);
    try {
      await assignQr.mutateAsync({
        nanoid,
        itemId: pendingItemId,
        force: true,
        currentItemId: conflictDetails.currentItemId,
      });
      notify("QR tag reassigned successfully", "success");
      const item = itemsData?.data?.find((i) => i.id === pendingItemId);
      navigate(`/admin/items/${item?.shortId || ""}`, { replace: true });
    } catch (err) {
      notify(
        err.response?.data?.message ||
          err.message ||
          "Failed to reassign QR tag",
        "error",
      );
    }
    setPendingItemId(null);
    setConflictDetails(null);
  };

  if (!resolved && !notFound) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Resolving QR code...</Typography>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">Item not found</Alert>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          onClick={() => navigate("/home")}
        >
          Go Home
        </Button>
      </Container>
    );
  }

  // Admin assignment UI
  if (showAssignUI) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Assign QR Tag
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          QR tag <strong>{nanoid}</strong> is not assigned. Select an item to
          assign it to:
        </Typography>
        <TextField
          label="Search items"
          fullWidth
          margin="normal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Paper sx={{ maxHeight: 400, overflow: "auto" }}>
          <List>
            {itemsData?.data?.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleAssign(item.id)}
              >
                <ListItemText
                  primary={item.name}
                  secondary={`${item.shortId} — ${item.category?.name || "No category"}`}
                />
              </ListItemButton>
            ))}
            {itemsData?.data?.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No items without QR tags found
              </Typography>
            )}
          </List>
        </Paper>
        <ConfirmDialog
          open={reassignConfirmOpen}
          title="Reassign QR Tag"
          message={`This QR tag is currently assigned to ${conflictDetails?.currentItemName || "another item"}. Reassign it?`}
          onConfirm={handleReassign}
          onCancel={() => {
            setReassignConfirmOpen(false);
            setConflictDetails(null);
            setPendingItemId(null);
          }}
          confirmText="Reassign"
          confirmColor="warning"
        />
      </Container>
    );
  }

  return null;
}
