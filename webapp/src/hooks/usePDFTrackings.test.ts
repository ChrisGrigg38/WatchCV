import { renderHook } from '@testing-library/react';
import { usePDFTrackings } from '../hooks/usePDFTrackings';

// Mock pdf-lib in full
jest.mock('pdf-lib', () => {
  const mockPage = {
    node: {
      setXObject: jest.fn(),
    },
    pushOperators: jest.fn(),
  };

  const mockPdfDoc = {
    getPages: jest.fn().mockReturnValue([mockPage]),
    addPage: jest.fn().mockReturnValue(mockPage),
    addJavaScript: jest.fn(),
    save: jest.fn().mockResolvedValue(new Uint8Array([10, 20, 30])),
    context: {
      obj: jest.fn().mockReturnValue({}),
      register: jest.fn().mockReturnValue({ ref: 'mock-ref' }),
    },
    catalog: { set: jest.fn() },
  };

  return {
    PDFDocument: {
      load: jest.fn().mockResolvedValue(mockPdfDoc),
    },
    PDFName: { of: jest.fn((s: string) => `PDFName(${s})`) },
    PDFNumber: { of: jest.fn((n: number) => `PDFNumber(${n})`) },
    PDFString: { of: jest.fn((s: string) => `PDFString(${s})`) },
    PDFRawStream: { of: jest.fn().mockReturnValue({ stream: true }) },
    pushGraphicsState: jest.fn().mockReturnValue('pushGS'),
    popGraphicsState: jest.fn().mockReturnValue('popGS'),
    concatTransformationMatrix: jest.fn().mockReturnValue('concat'),
    PDFOperator: { of: jest.fn().mockReturnValue('drawOp') },
    PDFOperatorNames: { DrawObject: 'Do' },
  };
});


if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function() {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new ArrayBuffer(1));
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock URL APIs
global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

// Helper to make a fake PDF File
const makePdfFile = (name = 'cv.pdf') =>
  new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], name, { type: 'application/pdf' });

describe('usePDFTrackings', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('embedJavascriptPDF', () => {
    test('returns a Uint8Array of pdf bytes', async () => {
      const { result } = renderHook(() => usePDFTrackings());
      const bytes = await result.current.embedJavascriptPDF(
        makePdfFile(),
        'https://example.com/api/addTracking',
        'track-123'
      );
      expect(bytes).toBeInstanceOf(Uint8Array);
    });

    test('calls PDFDocument.load with the file buffer', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      const file = makePdfFile();
      await result.current.embedJavascriptPDF(file, 'https://example.com/api/addTracking', 'track-123');
      expect(PDFDocument.load).toHaveBeenCalledTimes(1);
    });

    test('calls addJavaScript with the tracking script', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedJavascriptPDF(
        makePdfFile(),
        'https://example.com/api/addTracking',
        'track-456'
      );
      const mockDoc = await PDFDocument.load.mock.results[0].value;
      expect(mockDoc.addJavaScript).toHaveBeenCalledWith('open', expect.stringContaining('track-456'));
    });

    test('embeds the correct trackingUrl in the script', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedJavascriptPDF(
        makePdfFile(),
        'https://mysite.com/api/addTracking',
        'track-789'
      );
      const mockDoc = await PDFDocument.load.mock.results[0].value;
      const [[, scriptContent]] = mockDoc.addJavaScript.mock.calls;
      expect(scriptContent).toContain('https://mysite.com/api/addTracking?trackingId=track-789');
    });

    test('uses submitForm in the injected script', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedJavascriptPDF(makePdfFile(), 'https://example.com/api', 'tid-1');
      const mockDoc = await PDFDocument.load.mock.results[0].value;
      const [[, scriptContent]] = mockDoc.addJavaScript.mock.calls;
      expect(scriptContent).toContain('submitForm');
      expect(scriptContent).toContain('cURL');
    });
  });

  describe('embedXobjectPDF', () => {
    test('returns a Uint8Array of pdf bytes', async () => {
      const { result } = renderHook(() => usePDFTrackings());
      const bytes = await result.current.embedXobjectPDF(
        makePdfFile(),
        'https://example.com/api/addTracking',
        'track-xobj-1'
      );
      expect(bytes).toBeInstanceOf(Uint8Array);
    });

    test('calls getPages to find the first page', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedXobjectPDF(makePdfFile(), 'https://example.com/api', 'tid-xobj');
      const mockDoc = await PDFDocument.load.mock.results[0].value;
      expect(mockDoc.getPages).toHaveBeenCalled();
    });

    test('adds a new page when the PDF has no pages', async () => {
      const { PDFDocument } = require('pdf-lib');
      const mockPage = { node: { setXObject: jest.fn() }, pushOperators: jest.fn() };
      const emptyDoc = {
        getPages: jest.fn().mockReturnValue([]),
        addPage: jest.fn().mockReturnValue(mockPage),
        addJavaScript: jest.fn(),
        save: jest.fn().mockResolvedValue(new Uint8Array([1])),
        context: {
          obj: jest.fn().mockReturnValue({}),
          register: jest.fn().mockReturnValue({}),
        },
      };
      PDFDocument.load.mockResolvedValueOnce(emptyDoc);

      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedXobjectPDF(makePdfFile(), 'https://example.com/api', 'tid-new');

      expect(emptyDoc.addPage).toHaveBeenCalled();
    });

    test('registers an XObject on the first page', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedXobjectPDF(makePdfFile(), 'https://example.com/api', 'xobj-tid');
      const mockDoc = await PDFDocument.load.mock.results[0].value;
      const [firstPage] = mockDoc.getPages.mock.results[0].value;
      expect(firstPage.node.setXObject).toHaveBeenCalled();
    });

    test('pushes draw operators onto the first page', async () => {
      const { PDFDocument } = require('pdf-lib');
      const { result } = renderHook(() => usePDFTrackings());
      await result.current.embedXobjectPDF(makePdfFile(), 'https://example.com/api', 'xobj-draw');
      const mockDoc = await PDFDocument.load.mock.results[0].value;
      const [firstPage] = mockDoc.getPages.mock.results[0].value;
      expect(firstPage.pushOperators).toHaveBeenCalled();
    });
  });

  describe('savePDF', () => {
    beforeEach(() => {
      jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      document.body.innerHTML = '';
    });

    test('returns the output filename with _tracked suffix', () => {
      const { result } = renderHook(() => usePDFTrackings());
      const file = makePdfFile('my_resume.pdf');
      const name = result.current.savePDF(new Uint8Array([1, 2, 3]), file);
      expect(name).toBe('my_resume_tracked.pdf');
    });

    test('strips .pdf extension before adding _tracked.pdf', () => {
      const { result } = renderHook(() => usePDFTrackings());
      const file = makePdfFile('John_Smith_CV.pdf');
      const name = result.current.savePDF(new Uint8Array([1]), file);
      expect(name).toBe('John_Smith_CV_tracked.pdf');
    });

    test('calls URL.createObjectURL with a Blob', () => {
      const { result } = renderHook(() => usePDFTrackings());
      result.current.savePDF(new Uint8Array([1, 2, 3]), makePdfFile());
      expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    test('calls URL.revokeObjectURL after triggering download', () => {
      const { result } = renderHook(() => usePDFTrackings());
      result.current.savePDF(new Uint8Array([1, 2, 3]), makePdfFile());
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    test('triggers anchor click to initiate download', () => {
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      const { result } = renderHook(() => usePDFTrackings());
      result.current.savePDF(new Uint8Array([1, 2, 3]), makePdfFile());
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });
  });
});