import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AddButtonProps extends ButtonProps {
  // 可以在这里添加额外的 props
}

const AddButton: React.FC<AddButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddIcon />}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AddButton; 