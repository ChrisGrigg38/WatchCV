import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrackingLink from './TrackingLink';
import * as api from '../../api/trackingApi';

jest.mock('../../api/trackingApi');
const mockCreateTracking = api.createTracking as jest.MockedFunction<typeof api.createTracking>;

describe('TrackingLink', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renders input and generate button', () => {
    render(<TrackingLink onCreated={jest.fn()} />);
    expect(screen.getByPlaceholderText(/https:\/\/your-portfolio/i)).toBeInTheDocument();
    expect(screen.getByTestId('trackinglink-generate')).toBeInTheDocument();
  });

  test('shows validation error when URL is empty and button clicked', async () => {
    render(<TrackingLink onCreated={jest.fn()} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'blabla');

    act(() => { 
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });
  });

  test('shows validation error when URL is invalid', async () => {
    render(<TrackingLink onCreated={jest.fn()} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'not-a-url');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'not-a-url');
    })

    act(() => {
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });
  });

  test('calls createTracking with a valid URL', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'new-guid-123' });
    render(<TrackingLink onCreated={jest.fn()} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'https://example.com');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example.com');
    })

    act(() => {   
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })

    await waitFor(() => {
      expect(mockCreateTracking).toHaveBeenCalledTimes(1);
    });
  });

  test('displays generated tracking link after success', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'new-guid-123' });
    render(<TrackingLink onCreated={jest.fn()} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'https://example1.com');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example1.com');
    })

    act(() => {
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })

    await waitFor(() => {
      expect(screen.getByText(/your tracking link is ready/i)).toBeInTheDocument();
    });

    const link = screen.getByText(/redirect\?trackingId=new-guid-123/i);
    expect(link).toBeInTheDocument();
    expect(link.textContent).toContain('new-guid-123');
    expect(link.textContent).toContain('http://localhost/api/redirect?trackingId=new-guid-123&url=https%3A%2F%2Fexample1.com');
  });

  test('calls onCreated with trackingId and hostname label', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'new-guid-123' });
    const onCreated = jest.fn();
    render(<TrackingLink onCreated={onCreated} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'https://example.com');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example.com');
    })

    act(() => {
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('new-guid-123', 'https://example.com');
    });
  });

  test('shows error message when createTracking fails', async () => {
    mockCreateTracking.mockRejectedValue(new Error('Rate limit exceeded'));
    render(<TrackingLink onCreated={jest.fn()} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'https://example.com');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example.com');
    })

    act(() => {
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })

    await waitFor(() => {
      expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    });
  });

  test('clears error when user edits the URL input', async () => {
    mockCreateTracking.mockRejectedValue(new Error('Rate limit exceeded'));
    render(<TrackingLink onCreated={jest.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), 'https://example.com');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example.com');
    })
    
    act(() => {
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })

    await waitFor(() => screen.getByText(/rate limit exceeded/i));

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'x');
    expect(screen.queryByText(/rate limit exceeded/i)).not.toBeInTheDocument();
  });

  test('disables button while loading', async () => {
    mockCreateTracking.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TrackingLink onCreated={jest.fn()} />);

    await userEvent.type(screen.getByTestId('trackinglink-url'), 'https://example.com');

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example.com');
    })

    act( () => {
      fireEvent.click(screen.getByTestId('trackinglink-generate'));
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled();
    });
  });

  test('submits on Enter key press in the input', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'enter-guid' });
    render(<TrackingLink onCreated={jest.fn()} />);
    const input = screen.getByTestId('trackinglink-url');

    act(async () =>{
      await userEvent.type(input, 'https://example.com');
    })

    await waitFor(() => {
       expect(screen.getByTestId('trackinglink-url')).toHaveAttribute('value', 'https://example.com');
    })

    act(() => { 
      fireEvent.keyDown(input, { key: 'Enter' });
    })

    await waitFor(() => {
      expect(mockCreateTracking).toHaveBeenCalledTimes(1);
    });
  });
});