const { PDFDocument } = require('pdf-lib');

(async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  page.drawText('Hello, this is a test encrypted PDF!', {
    x: 50, y: 350, size: 24,
  });

  console.log('pdfDoc.save type:', typeof pdfDoc.save);
  console.log('save keys:', Object.keys(pdfDoc.save || {}));

  const encryptOpts = {
    encrypt: {
      userPassword: 'test123',
      ownerPassword: 'owner456',
      permissions: {
        printing: 'highQuality',
        modifying: false,
        copying: true,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      },
    },
  };

  const pdfBytes = await pdfDoc.save(encryptOpts);

  console.log('PDF length:', pdfBytes.length);
  console.log('First 100 bytes:', Buffer.from(pdfBytes.slice(0, 100)).toString('hex'));

  const pdfStr = Buffer.from(pdfBytes).toString('utf-8');
  console.log('Contains /Encrypt:', pdfStr.includes('/Encrypt'));
  console.log('Contains /V:', pdfStr.includes('/V'));
  console.log('Contains /Filter:', pdfStr.includes('/Filter'));

  const fs = require('fs');
  fs.writeFileSync('/tmp/test-encrypted.pdf', pdfBytes);
  console.log('Saved to /tmp/test-encrypted.pdf');
})();
