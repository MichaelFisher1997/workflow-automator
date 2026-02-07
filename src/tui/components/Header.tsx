import React from 'react';
import { Box, Text } from 'ink';
import { cyberpunkTheme } from '../theme/cyberpunk.js';

interface HeaderProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  workflowCount: number;
}

export function Header({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  workflowCount 
}: HeaderProps) {
  const currentIndex = categories.indexOf(selectedCategory);
  
  const prevCategory = () => {
    const newIndex = (currentIndex - 1 + categories.length) % categories.length;
    onCategoryChange(categories[newIndex]!);
  };
  
  const nextCategory = () => {
    const newIndex = (currentIndex + 1) % categories.length;
    onCategoryChange(categories[newIndex]!);
  };

  return (
    <Box
      height={3}
      borderStyle="single"
      borderColor={cyberpunkTheme.colors.border}
      paddingX={1}
      alignItems="center"
    >
      <Text bold color={cyberpunkTheme.colors.primary}>
        ⚡ ACTIONFLOW
      </Text>
      
      <Box marginLeft={2}>
        <Text color={cyberpunkTheme.colors.muted}>
          Category: [
        </Text>
        <Text color={cyberpunkTheme.colors.secondary}>
          ← {selectedCategory} →
        </Text>
        <Text color={cyberpunkTheme.colors.muted}>
          ] ({workflowCount} workflows)
        </Text>
      </Box>
      
      <Box flexGrow={1} />
      
      <Text color={cyberpunkTheme.colors.muted}>
        [?] Help
      </Text>
    </Box>
  );
}
