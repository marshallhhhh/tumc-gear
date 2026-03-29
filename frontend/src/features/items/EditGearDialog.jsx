import { useState, useEffect } from "react";
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
import { useUpdateItem } from "../../hooks/useItems";
import { useCategories, useCreateCategory } from "../../hooks/useCategories";
import { useNotification } from "../../context/NotificationContext";

export default function EditGearDialog({ item, open, onClose }) {
  const { notify } = useNotification();
  const { data: categories } = useCategories();
  const updateItem = useUpdateItem();
  const createCategory = useCreateCategory();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (item && open) {
      setName(item.name || "");
      setDescription(item.description || "");
      setCategoryId(item.categoryId || "");
      setSerialNumber(item.serialNumber || "");
      setNewCategoryName("");
      setCreatingCategory(false);
    }
  }, [item, open]);

  const handleSave = async () => {
    let catId = categoryId;

    if (creatingCategory && newCategoryName.trim()) {
      try {
        const cat = await createCategory.mutateAsync({
          name: newCategoryName.trim(),
        });
        catId = cat.id;
      } catch (err) {
        notify(
          err.response?.data?.message ||
            err.message ||
            "Failed to create category",
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
      await updateItem.mutateAsync({
        id: item.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          categoryId: catId,
          serialNumber: serialNumber.trim() || null,
        },
      });
      notify("Item updated", "success");
      onClose();
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || "Failed to update item",
        "error",
      );
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
      <DialogTitle sx={{ p: 0 }}>Edit Gear</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <TextField
          label="Name"
          fullWidth
          required
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
        />
        {!creatingCategory ? (
          <Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                label="Category"
              >
                {categories?.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
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
              margin="normal"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
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
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
        <TextField
          label="Serial Number"
          fullWidth
          margin="normal"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!name.trim() || updateItem.isPending}
        >
          {updateItem.isPending ? <CircularProgress size={24} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
