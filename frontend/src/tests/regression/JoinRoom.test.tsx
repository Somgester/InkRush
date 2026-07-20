import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JoinRoom from '../../components/JoinRoom';
import { GoogleOAuthProvider } from '@react-oauth/google';

const renderWithGoogle = (ui: React.ReactElement) => {
    return render(
        <GoogleOAuthProvider clientId="test-client-id">
            {ui}
        </GoogleOAuthProvider>
    );
};
describe('JoinRoom component', () => {
    it('should call onJoin with username and empty roomId when room code is empty', () => {
        const handleJoin = vi.fn();
        renderWithGoogle(<JoinRoom onJoin={handleJoin} />);
        
        const usernameInput = screen.getByPlaceholderText(/John Doe/i);
        const submitButton = screen.getByText(/START DRAWING/i);
        
        fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
        fireEvent.click(submitButton);
        
        expect(handleJoin).toHaveBeenCalledWith('TestUser', '', undefined);
    });

    it('should call onJoin with username and roomId when both are provided', () => {
        const handleJoin = vi.fn();
        renderWithGoogle(<JoinRoom onJoin={handleJoin} />);
        
        const usernameInput = screen.getByPlaceholderText(/John Doe/i);
        const roomIdInput = screen.getByPlaceholderText(/ROOM_CODE/i);
        const submitButton = screen.getByText(/START DRAWING/i);
        
        fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
        fireEvent.change(roomIdInput, { target: { value: 'Room123' } });
        fireEvent.click(submitButton);
        
        expect(handleJoin).toHaveBeenCalledWith('TestUser', 'Room123', undefined);
    });

    it('should display quick join error when provided', () => {
        const errorMsg = "No open rooms right now.";
        renderWithGoogle(<JoinRoom onJoin={vi.fn()} quickJoinError={errorMsg} />);
        
        expect(screen.getByText(errorMsg)).toBeDefined();
    });
});
