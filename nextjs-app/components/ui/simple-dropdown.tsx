"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"

interface DropdownOption {
  id: string
  label: string
  sublabel?: string
}

interface SimpleDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SimpleDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.id === value)

  const buttonStyle = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: 'rgb(24, 24, 27)',
    border: '1px solid rgb(39, 39, 42)',
    borderRadius: '6px',
    color: 'rgb(244, 244, 245)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'none'
  }

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'rgb(24, 24, 27)',
    border: '1px solid rgb(39, 39, 42)',
    borderRadius: '6px',
    maxHeight: '300px',
    overflowY: 'auto' as const,
    zIndex: 9999,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    minWidth: '100%',
    width: 'max-content'
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={buttonStyle}
        disabled={disabled}
        onFocus={(e) => {
          e.currentTarget.style.outline = 'none';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.backgroundColor = 'rgb(24, 24, 27)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(24, 24, 27)';
        }}
      >
        <span style={{ color: selectedOption ? 'rgb(244, 244, 245)' : 'rgb(113, 113, 122)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          style={{ 
            width: '16px', 
            height: '16px', 
            color: 'rgb(113, 113, 122)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {isOpen && (
        <div style={{...dropdownStyle, position: 'fixed'}} ref={(el) => {
          if (el && dropdownRef.current) {
            const buttonRect = dropdownRef.current.getBoundingClientRect();
            el.style.top = `${buttonRect.bottom + 4}px`;
            el.style.left = `${buttonRect.left}px`;
            el.style.width = `${buttonRect.width}px`;
          }
        }}>
          <div style={{ padding: '4px' }}>
            {options.length === 0 ? (
              <div style={{
                padding: '12px',
                textAlign: 'center',
                color: 'rgb(113, 113, 122)',
                fontSize: '14px'
              }}>
                No options found
              </div>
            ) : (
              options.map((option) => (
                <DropdownOption
                  key={option.id}
                  option={option}
                  isSelected={value === option.id}
                  onClick={() => {
                    onChange(option.id)
                    setIsOpen(false)
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownOption({ 
  option, 
  isSelected, 
  onClick 
}: { 
  option: DropdownOption
  isSelected: boolean
  onClick: () => void 
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '8px 12px',
        backgroundColor: isHovered ? 'rgb(39, 39, 42)' : 'rgb(24, 24, 27)',
        color: 'rgb(244, 244, 245)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        borderRadius: '4px'
      }}
    >
      <Check 
        style={{ 
          width: '16px', 
          height: '16px',
          opacity: isSelected ? 1 : 0
        }} 
      />
      <div style={{ flex: 1 }}>
        <div>{option.label}</div>
        {option.sublabel && (
          <div style={{ fontSize: '12px', color: 'rgb(113, 113, 122)' }}>
            {option.sublabel}
          </div>
        )}
      </div>
    </div>
  )
}