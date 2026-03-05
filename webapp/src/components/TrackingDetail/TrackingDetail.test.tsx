import { render, screen, waitFor } from '@testing-library/react';
import TrackingDetail from './TrackingDetail';
import * as api from '../../api/trackingApi';

jest.mock('../../api/trackingApi');
const mockGetTracking = api.getTracking as jest.MockedFunction<typeof api.getTracking>;

const mockDetail = {
  tracking: {
    trackingId: 'track-abc',
    createdAt: '2024-01-10T08:00:00.000Z',
    lastUpdatedAt: '2024-03-01T14:00:00.000Z',
  },
  events: [
    {
      eventId: 'evt-1',
      trackingId: 'track-abc',
      ipAddress: '192.168.1.1',
      createdAt: '2024-03-01T10:00:00.000Z',
      lastUpdatedAt: '2024-03-01T10:00:00.000Z',
    },
    {
      eventId: 'evt-2',
      trackingId: 'track-abc',
      ipAddress: '10.0.0.5',
      createdAt: '2024-03-01T14:00:00.000Z',
      lastUpdatedAt: '2024-03-01T14:00:00.000Z',
    },
  ],
};

describe('TrackingDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows loading spinner initially', () => {
    mockGetTracking.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<TrackingDetail trackingId="track-abc" />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('renders tracking detail after successful fetch', async () => {
    mockGetTracking.mockResolvedValue(mockDetail);
    render(<TrackingDetail trackingId="track-abc" />);

    await waitFor(() => {
      expect(screen.getByText('📊 Tracking Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // total opens
    expect(screen.getByText(/10\/01\/2024|Jan 10|1\/10\/2024/i)).toBeInTheDocument(); // created date
  });

  test('shows error message when fetch fails', async () => {
    mockGetTracking.mockRejectedValue(new Error('Tracking not found'));
    render(<TrackingDetail trackingId="bad-id" />);

    await waitFor(() => {
      expect(screen.getByText(/tracking not found/i)).toBeInTheDocument();
    });
  });

  test('displays total open count correctly', async () => {
    mockGetTracking.mockResolvedValue(mockDetail);
    render(<TrackingDetail trackingId="track-abc" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  test('renders the recent events table', async () => {
    mockGetTracking.mockResolvedValue(mockDetail);
    render(<TrackingDetail trackingId="track-abc" />);

    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
    });
  });

  test('shows "Never" for last seen when no events', async () => {
    mockGetTracking.mockResolvedValue({ ...mockDetail, events: [] });
    render(<TrackingDetail trackingId="track-abc" />);

    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  test('displays the trackingId in the footer', async () => {
    mockGetTracking.mockResolvedValue(mockDetail);
    render(<TrackingDetail trackingId="track-abc" />);

    await waitFor(() => {
      expect(screen.getByText('track-abc')).toBeInTheDocument();
    });
  });

  test('refetches when trackingId prop changes', async () => {
    mockGetTracking.mockResolvedValue(mockDetail);
    const { rerender } = render(<TrackingDetail trackingId="track-abc" />);
    await waitFor(() => screen.getByText('📊 Tracking Analytics'));

    mockGetTracking.mockResolvedValue({
      ...mockDetail,
      tracking: { ...mockDetail.tracking, trackingId: 'track-xyz' },
    });

    rerender(<TrackingDetail trackingId="track-xyz" />);

    await waitFor(() => {
      expect(mockGetTracking).toHaveBeenCalledTimes(2);
      expect(mockGetTracking).toHaveBeenCalledWith('track-xyz');
    });
  });
});