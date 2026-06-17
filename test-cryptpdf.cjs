const { encryptPDF, decryptPDF } = require('cryptpdf');
const fs = require('fs');

(async () => {
  try {
    // 创建一个简单的测试 PDF
    const { PDFDocument } = require('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    page.drawText('Hello Encrypted PDF!', { x: 50, y: 350, size: 24 });
    const pdfBytes = await pdfDoc.save();

    console.log('Original PDF size:', pdfBytes.length);
    const pdfStr = Buffer.from(pdfBytes).toString('utf-8');
    console.log('Contains /Encrypt (original):', pdfStr.includes('/Encrypt'));

    // 加密
    const encrypted = await encryptPDF(pdfBytes, 'test123', 'owner456');
    console.log('Encrypted PDF size:', encrypted.length);
    const encStr = Buffer.from(encrypted).toString('utf-8');
    console.log('Contains /Encrypt (encrypted):', encStr.includes('/Encrypt'));
    console.log('Contains /V:', encStr.includes('/V'));
    console.log('Contains /Filter:', encStr.includes('/Filter'));
    console.log('Contains /StmF:', encStr.includes('/StmF'));

    // 写入文件
    fs.writeFileSync('/tmp/test-cryptpdf-encrypted.pdf', encrypted);
    console.log('Saved to /tmp/test-cryptpdf-encrypted.pdf');

    // 尝试解密
    try {
      const decrypted = await decryptPDF(encrypted, 'test123');
      console.log('Decrypted with user password, size:', decrypted.length);
    } catch (e) {
      console.log('Decrypt with user password failed:', e.message);
    }

    try {
      const decrypted2 = await decryptPDF(encrypted, 'wrongpass');
      console.log('Decrypt with wrong password succeeded unexpectedly!');
    } catch (e) {
      console.log('Decrypt with wrong password correctly failed:', e.message);
    }

    console.log('\n✅ Test completed!');
  } catch (e) {
    console.error('Error:', e);
  }
})();
