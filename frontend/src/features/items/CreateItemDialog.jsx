import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
} from "@mui/material";
import { useCreateItem } from "../../hooks/useItems";
import { useCategories, useCreateCategory } from "../../hooks/useCategories";
import { useNotification } from "../../context/NotificationContext";

export default function CreateItemDialog({ open, onClose, onCreated }) {
  const { notify } = useNotification();
  const { data: categories } = useCategories();
  const createItem = useCreateItem();
  const createCategory = useCreateCategory();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setNewCategoryName("");
    setDescription("");
    setSerialNumber("");
    setCreatingCategory(false);
  };

  const handleSubmit = async () => {
    let catId = categoryId;

    // Create new category if needed
    if (creatingCategory && newCategoryName.trim()) {
      try {
        const cat = await createCategory.mutateAsync({
          name: newCategoryName.trim(),
        });
        catId = cat.id;
      } catch (err) {
        notify(
          err.response?.data?.message || "Failed to create category",
          "error",
        );
        return;
      }
    }

    if (!catId) {
      notify("Please select or create a category", "error");
      return;
    }

    try {
      const item = await createItem.mutateAsync({
        name: name.trim(),
        categoryId: catId,
        description: description.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
      });
      notify("Item created", "success");
      resetForm();
      onClose();
      onCreated?.(item);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create item", "error");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { p: 3 } } }}
    >
      <DialogTitle gutterBottom sx={{ p: 0 }}>
        Add Gear
      </DialogTitle>
      <DialogContent
        sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {!creatingCategory ? (
          <Box>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="Category"
              >
                {categories?.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" onClick={() => setCreatingCategory(true)}>
              + Create new category
            </Button>
          </Box>
        ) : (
          <Box>
            <TextField
              label="New Category Name"
              fullWidth
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button
              size="small"
              onClick={() => {
                setCreatingCategory(false);
                setNewCategoryName("");
              }}
            >
              Select existing category
            </Button>
          </Box>
        )}

        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextField
          label="Serial Number"
          fullWidth
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || createItem.isPending}
        >
          {createItem.isPending ? <CircularProgress size={24} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
