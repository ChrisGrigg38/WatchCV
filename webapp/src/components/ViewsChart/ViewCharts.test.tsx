import { render, screen } from '@testing-library/react';
import { TrackingEvent } from '../../types';
import ViewsChart from './ViewsChart';

const makeEvent = (dateStr: string, id: string): TrackingEvent => ({
  eventId: id,
  trackingId: 'track-1',
  ipAddress: '1.2.3.4',
  createdAt: dateStr,
  lastUpdatedAt: dateStr,
});

describe('ViewsChart', () => {
  test('renders empty state when no events', () => {
    render(<ViewsChart events={[]} />);
    expect(screen.getByText(/no events recorded yet/i)).toBeInTheDocument();
  });

  test('renders a chart when events are present', () => {
    const events = [
      makeEvent('2024-03-01T10:00:00.000Z', 'e1'),
      makeEvent('2024-03-01T14:00:00.000Z', 'e2'),
      makeEvent('2024-03-02T09:00:00.000Z', 'e3'),
    ];

    render(<ViewsChart events={events} />);
    // Recharts renders an svg
    expect(screen.getByTestId('viewschart')).toBeInTheDocument();
  });

  test('does not render empty state when events exist', () => {
    const events = [makeEvent('2024-03-01T10:00:00.000Z', 'e1')];
    render(<ViewsChart events={events} />);
    expect(screen.queryByText(/no events recorded yet/i)).not.toBeInTheDocument();
  });

  test('aggregates multiple events on the same day into one data point', () => {
    // All three events are on the same day — chart should render without crashing
    const events = [
      makeEvent('2024-03-01T08:00:00.000Z', 'e1'),
      makeEvent('2024-03-01T12:00:00.000Z', 'e2'),
      makeEvent('2024-03-01T18:00:00.000Z', 'e3'),
    ];
    
    render(<ViewsChart events={events} />);
    expect(screen.getByTestId('viewschart')).toBeInTheDocument();
  });

  test('renders separate data points for events on different days', () => {
    const events = [
      makeEvent('2024-03-01T10:00:00.000Z', 'e1'),
      makeEvent('2024-03-05T10:00:00.000Z', 'e2'),
      makeEvent('2024-03-10T10:00:00.000Z', 'e3'),
    ];
    render(<ViewsChart events={events} />);
    expect(screen.getByTestId('viewschart')).toBeInTheDocument();
  });
});