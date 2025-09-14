import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';

const EditableQuantity = ({ 
  value, 
  onSave, 
  className = '', 
  inputClassName = '',
  min = 0,
  disabled = false,
  placeholder = '',
  onEnterKey = null
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleSave = () => {
    const numValue = parseInt(editValue) || 0;
    const validValue = Math.max(numValue, min);
    
    if (validValue !== value) {
      onSave(validValue);
    }
    
    setIsEditing(false);
    setEditValue(validValue);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEnterKey) {
        onEnterKey();
      }
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    // Allow empty string or valid numbers
    if (newValue === '' || /^\d+$/.test(newValue)) {
      setEditValue(newValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`${inputClassName} text-center`}
        placeholder={placeholder}
        min={min}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`
        ${className} 
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-100 rounded px-1'} 
        transition-colors select-none
      `}
      title={disabled ? '' : 'Click to edit'}
    >
      {value}
    </span>
  );
};

export default EditableQuantity;