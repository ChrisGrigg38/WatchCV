import { PDFDocument, PDFName, PDFNumber, PDFString,
         PDFDict, PDFRawStream, 
         pushGraphicsState,
         concatTransformationMatrix,
         popGraphicsState,
         PDFOperator,
         PDFOperatorNames} from 'pdf-lib';


export const usePDFTrackings = () => {

    const embedXobjectPDF = async (filePath: File, trackingUrl: string, trackingId: string) => {
        const arrayBuffer = await filePath.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const getUrl = `${trackingUrl}?trackingId=` + trackingId;

        // Get all pages in the document
        const pages = pdfDoc.getPages(); //

        let firstPage;

        // Check if any pages exist
        if (pages.length > 0) {
            // If pages exist, get the first one (index 0)
            firstPage = pages[0]; //
        } else {
            // If no pages exist, add a new blank page
            firstPage = pdfDoc.addPage(); //
        }

        // 1. File Specification object
        const filespecRef = pdfDoc.context.register(
            pdfDoc.context.obj({
                Type: PDFName.of('Filespec'),
                FS:   PDFName.of('URL'),
                F:    PDFString.of(getUrl),
            })
        );

        // 2. Image XObject with external stream (/F → filespecRef)
        const imgDict = pdfDoc.context.obj({
            Type:             PDFName.of('XObject'),
            Subtype:          PDFName.of('Image'),
            Width:            PDFNumber.of(400),
            Height:           PDFNumber.of(300),
            ColorSpace:       PDFName.of('DeviceRGB'),
            BitsPerComponent: PDFNumber.of(8),
            Filter:           PDFName.of('DCTDecode'),
            F:                filespecRef,           // ← the magic
            Length:           PDFNumber.of(0),
        });

        const imgStream = PDFRawStream.of(imgDict as PDFDict, new Uint8Array(0));
        const imgRef    = pdfDoc.context.register(imgStream);

        // 3. Register as named resource on the page
        firstPage.node.setXObject(PDFName.of('Im1'), imgRef);

        // 4. Draw via content stream operator
        firstPage.pushOperators(
            pushGraphicsState(),
            concatTransformationMatrix(400, 0, 0, 300, 100, 400),
            PDFOperator.of(PDFOperatorNames.DrawObject, [PDFName.of('Im1')]),
            popGraphicsState(),
        );

        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    const embedJavascriptPDF = async (filePath: File, trackingUrl: string, trackingId: string) => {
        const arrayBuffer = await filePath.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const trackingScript = `
            this.submitForm({
                cURL: "${trackingUrl}?trackingId=${trackingId}",
                cSubmitAs: "HTML"
            });
        `.trim(); 

      pdfDoc.addJavaScript('open', trackingScript);

      const pdfBytes = await pdfDoc.save()
      return pdfBytes
    }

    const savePDF = (pdfBytes: Uint8Array<ArrayBufferLike>, originalFile: File) => {
        const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const baseName = originalFile.name.replace(/\.pdf$/i, "");
        const outputName = `${baseName}_tracked.pdf`;
        a.href = url;
        a.download = outputName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return outputName        
    }

    return { embedXobjectPDF, embedJavascriptPDF, savePDF }
}