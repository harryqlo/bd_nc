import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children and responds to click', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Enviar</Button>);
    const btn = screen.getByRole('button', { name: /enviar/i });
    await user.click(btn);
    expect(handleClick).toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
