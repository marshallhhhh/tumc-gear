import { Dialog as MuiDialog } from "@mui/material";
import { DialogTitle as MuiDialogTitle } from "@mui/material";
import { DialogContent as MuiDialogContent } from "@mui/material";
import { DialogActions as MuiDialogActions } from "@mui/material";
import { styled } from "@mui/material/styles";

export const Dialog = styled(MuiDialog)(({ theme }) => ({
  padding: 0,
  "& .MuiDialog-paper": {
    padding: theme.spacing(3),
  },
}));

export const DialogTitle = styled(MuiDialogTitle)(({ theme }) => ({
  padding: 0,
  marginBottom: theme.spacing(1),
}));

export const DialogContent = styled(MuiDialogContent)(({ theme }) => ({
  padding: 0,
  paddingTop: theme.spacing(1),
}));

export const DialogActions = styled(MuiDialogActions)(({ theme }) => ({
  padding: 0,
  paddingTop: theme.spacing(1),
}));
