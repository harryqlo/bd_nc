import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

describe('LoginPage', () => {
  it('shows error on invalid credentials', async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    render(
      <AuthContext.Provider value={{ user: null, login, logout: vi.fn(), loading: false }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'wrong');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls login with valid credentials', async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    render(
      <AuthContext.Provider value={{ user: null, login, logout: vi.fn(), loading: false }}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'admin');
    await user.type(screen.getByLabelText(/contraseña/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(login).toHaveBeenCalledWith('admin', UserRole.ADMIN);
  });
});
