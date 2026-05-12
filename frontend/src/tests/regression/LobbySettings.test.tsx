import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LobbySettings from '../../components/LobbySettings';
import type { RoomSettings } from '../../types';

describe('LobbySettings Regression Tests', () => {
    const mockSettings: RoomSettings = {
        maxPlayers: 8,
        totalRounds: 5,
        drawingTime: 60,
        customWords: ['fun', 'game']
    };
    const mockOnUpdate = vi.fn();

    it('should disable inputs if user is not host', () => {
        render(<LobbySettings settings={mockSettings} onUpdate={mockOnUpdate} isHost={false} />);
        
        expect(screen.getByRole('combobox', { name: /max players/i })).toBeDisabled();
        expect(screen.getByRole('combobox', { name: /total rounds/i })).toBeDisabled();
        expect(screen.getByRole('combobox', { name: /drawing time/i })).toBeDisabled();
        expect(screen.getByPlaceholderText(/word1, word2, word3/i)).toBeDisabled();
    });

    it('should enable inputs if user is host', () => {
        render(<LobbySettings settings={mockSettings} onUpdate={mockOnUpdate} isHost={true} />);
        
        expect(screen.getByRole('combobox', { name: /max players/i })).toBeEnabled();
        expect(screen.getByRole('combobox', { name: /total rounds/i })).toBeEnabled();
        expect(screen.getByRole('combobox', { name: /drawing time/i })).toBeEnabled();
        expect(screen.getByPlaceholderText(/word1, word2, word3/i)).toBeEnabled();
    });

    it('should call onUpdate when a setting is changed', () => {
        render(<LobbySettings settings={mockSettings} onUpdate={mockOnUpdate} isHost={true} />);
        
        const select = screen.getByRole('combobox', { name: /max players/i });
        fireEvent.change(select, { target: { value: '12' } });
        
        expect(mockOnUpdate).toHaveBeenCalledWith({ maxPlayers: 12 });
    });

    it('should parse custom words correctly', () => {
        render(<LobbySettings settings={mockSettings} onUpdate={mockOnUpdate} isHost={true} />);
        
        const textarea = screen.getByPlaceholderText(/word1, word2, word3/i);
        fireEvent.change(textarea, { target: { value: 'pizza, pasta, gelato' } });
        
        expect(mockOnUpdate).toHaveBeenCalledWith({ customWords: ['pizza', 'pasta', 'gelato'] });
    });
});
