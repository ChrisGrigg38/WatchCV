import { render, screen, fireEvent } from '@testing-library/react';
import TrackingList from './TrackingList';
import { StoredTracking } from '../../types';

const mockTrackings: StoredTracking[] = [
  { trackingId: 'abc-123', label: 'My CV', createdAt: '2024-01-15T10:00:00.000Z' },
  { trackingId: 'def-456', label: 'Portfolio', createdAt: '2024-02-20T12:00:00.000Z' },
];

describe('TrackingList', () => {
  test('renders empty state when no trackings', () => {
    render(
      <TrackingList trackings={[]} selectedId={null} onSelect={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText(/no trackings yet/i)).toBeInTheDocument();
    expect(screen.getByText(/upload a cv above/i)).toBeInTheDocument();
  });

  test('renders all tracking labels', () => {
    render(
      <TrackingList trackings={mockTrackings} selectedId={null} onSelect={jest.fn()} onRemove={jest.fn()} />
    );
    expect(screen.getByText('My CV')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  test('renders truncated trackingId for each entry', () => {
    render(
      <TrackingList trackings={mockTrackings} selectedId={null} onSelect={jest.fn()} onRemove={jest.fn()} />
    );
    // Each row shows first 20 chars of trackingId followed by ellipsis
    expect(screen.getByText(/abc-123/)).toBeInTheDocument();
  });

  test('calls onSelect when a row is clicked', () => {
    const onSelect = jest.fn();
    render(
      <TrackingList trackings={mockTrackings} selectedId={null} onSelect={onSelect} onRemove={jest.fn()} />
    );
    fireEvent.click(screen.getByText('My CV'));
    expect(onSelect).toHaveBeenCalledWith('abc-123');
  });

  test('calls onSelect when view button is clicked', () => {
    const onSelect = jest.fn();
    render(
      <TrackingList trackings={mockTrackings} selectedId={null} onSelect={onSelect} onRemove={jest.fn()} />
    );
    const viewButtons = screen.getAllByTitle('View stats');
    fireEvent.click(viewButtons[0]);
    expect(onSelect).toHaveBeenCalledWith('abc-123');
  });

  test('calls onRemove when delete button is clicked and does not trigger onSelect', () => {
    const onSelect = jest.fn();
    const onRemove = jest.fn();
    render(
      <TrackingList trackings={mockTrackings} selectedId={null} onSelect={onSelect} onRemove={onRemove} />
    );
    const deleteButtons = screen.getAllByTitle('Remove from list');
    fireEvent.click(deleteButtons[1]);
    expect(onRemove).toHaveBeenCalledWith('def-456');
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('applies selected styles to the selected row', () => {
    const { container } = render(
      <TrackingList trackings={mockTrackings} selectedId="abc-123" onSelect={jest.fn()} onRemove={jest.fn()} />
    );
    // The selected row should contain the indigo border class
    const rows = container.querySelectorAll('[class*="border-indigo"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('renders formatted creation dates', () => {
    render(
      <TrackingList trackings={mockTrackings} selectedId={null} onSelect={jest.fn()} onRemove={jest.fn()} />
    );
    // Date should be rendered in some locale format — just check it's present
    expect(screen.getByText(/15\/01\/2024|1\/15\/2024|Jan 15/i)).toBeInTheDocument();
  });
});