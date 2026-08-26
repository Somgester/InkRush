import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WordSelection from '../../components/WordSelection';

describe('WordSelection Regression Tests', () => {
    const mockWords = ['Apple', 'Banana', 'Cherry'];
    const mockOnSelect = vi.fn();

    it('should render all word choices', () => {
        render(<WordSelection words={mockWords} onSelect={mockOnSelect} />);
        
        mockWords.forEach(word => {
            expect(screen.getByText(word)).toBeInTheDocument();
        });
    });

    it('should call onSelect when a word is clicked', () => {
        render(<WordSelection words={mockWords} onSelect={mockOnSelect} />);
        
        const wordButton = screen.getByText('Apple');
        fireEvent.click(wordButton);
        
        expect(mockOnSelect).toHaveBeenCalledWith('Apple');
    });

    it('should show the artist prompt', () => {
        render(<WordSelection words={mockWords} onSelect={mockOnSelect} />);
        expect(screen.getByText('Select Target')).toBeInTheDocument();
        expect(screen.getByText('Choose an item to draw.')).toBeInTheDocument();
    });
});
