import React from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, onSearch, placeholder }) => {
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder || 'Search...'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={handleKeyPress}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={onSearch} edge="end">
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        minWidth: '200px',
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px', 
        },
      }}
    />
  );
};

export default SearchBox; 