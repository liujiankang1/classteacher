import React from 'react';
import { TextField, MenuItem, TextFieldProps } from '@mui/material';

interface OptionType {
  value: string | number;
  label: string;
}

interface CustomSelectProps extends Omit<TextFieldProps, 'onChange'> {
  options: OptionType[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  prefixIcon?: React.ReactNode; // 对应 Vue 的 prefix-icon
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  prefixIcon,
  label,
  ...props
}) => {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
      fullWidth
      InputProps={{
        startAdornment: prefixIcon ? (
          <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>
            {prefixIcon}
          </span>
        ) : null,
      }}
      sx={{
        minWidth: 160,
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px', // 对应 apple-search 的圆角
        },
      }}
      {...props} // 传递其他 TextFieldProps，例如 helperText, error
    >
      {placeholder && (
        <MenuItem value="" disabled>
          <em>{placeholder}</em>
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default CustomSelect; 