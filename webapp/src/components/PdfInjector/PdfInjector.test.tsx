import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as api from '../../api/trackingApi';
import PdfInjector from './PdfInjector';

jest.mock('../../api/trackingApi');
const mockCreateTracking = api.createTracking as jest.MockedFunction<typeof api.createTracking>;

// Mock pdf-lib — we don't want to actually process PDFs in unit tests
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn().mockResolvedValue({
      catalog: {
        set: jest.fn(),
      },
      context: {
        obj: jest.fn().mockReturnValue({}),
      },
      save: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      addJavaScript: jest.fn(),
    }),
  },
  PDFName: { of: jest.fn((s: string) => s) },
  PDFString: { of: jest.fn((s: string) => s) },
}));

if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function() {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new ArrayBuffer(1));
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Helper to create a mock PDF File
const makePdfFile = (name = 'mycv.pdf') =>
  new File(["bla"], name, { type: 'text/plain' });

describe('PdfInjector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document.body between tests (anchor click mocking)
    document.body.innerHTML = '';
  });

  test('renders upload button', () => {
    render(<PdfInjector onCreated={jest.fn()} />);
    expect(screen.getByText(/select cv pdf/i)).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<PdfInjector onCreated={jest.fn()} />);
    expect(screen.getByText(/track your cv/i)).toBeInTheDocument();
    expect(screen.getByText(/embed invisible tracking/i)).toBeInTheDocument();
  });

  test('calls createTracking and onCreated when a PDF is selected', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'pdf-tracking-guid' });
    const onCreated = jest.fn();

    // Spy on anchor click to prevent jsdom navigation error
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<PdfInjector onCreated={onCreated} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makePdfFile()] } });

    await waitFor(() => {
      expect(mockCreateTracking).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith('pdf-tracking-guid', 'mycv_tracked.pdf');
    });

    clickSpy.mockRestore();
  });

  test('shows status messages during processing', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'pdf-tracking-guid' });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<PdfInjector onCreated={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makePdfFile()] } });

    await waitFor(() => {
      expect(screen.getByText(/creating tracking id/i)).toBeInTheDocument();
    });
  });

  test('shows success message with filename after completion', async () => {
    mockCreateTracking.mockResolvedValue({ trackingId: 'pdf-tracking-guid' });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<PdfInjector onCreated={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makePdfFile('my_resume.pdf')] } });

    await waitFor(() => {
      expect(screen.getByText(/my_resume_tracked\.pdf/i)).toBeInTheDocument();
    });
  });

  test('shows error message when createTracking fails', async () => {
    mockCreateTracking.mockRejectedValue(new Error('Too many requests'));
    render(<PdfInjector onCreated={jest.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makePdfFile()] } });

    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });

  test('does not call onCreated when createTracking fails', async () => {
    mockCreateTracking.mockRejectedValue(new Error('Server error'));
    const onCreated = jest.fn();
    render(<PdfInjector onCreated={onCreated} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makePdfFile()] } });

    await waitFor(() => screen.getByText(/server error/i));
    expect(onCreated).not.toHaveBeenCalled();
  });
});