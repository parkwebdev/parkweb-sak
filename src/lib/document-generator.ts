import jsPDF from 'jspdf';

export const generateScopeOfWorkPDF = (sowData: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Scope of Work', margin, yPosition);
  yPosition += 15;

  // Project Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sowData.title, margin, yPosition);
  yPosition += 10;

  // Client Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client: ${sowData.client}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Contact: ${sowData.clientContact}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Industry: ${sowData.industry}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Status: ${sowData.status}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Pages: ${sowData.pages}`, margin, yPosition);
  yPosition += 15;

  // Integrations
  if (sowData.integrations && sowData.integrations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Integrations:', margin, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    sowData.integrations.forEach((integration: string) => {
      doc.text(`• ${integration}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
  }

  // Content
  if (sowData.content) {
    doc.setFont('helvetica', 'bold');
    doc.text('Project Details:', margin, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Split content into lines that fit the page width
    const lines = doc.splitTextToSize(sowData.content, pageWidth - (margin * 2));
    
    lines.forEach((line: string) => {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
  }

  // Footer
  const today = new Date().toLocaleDateString();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on: ${today}`, margin, doc.internal.pageSize.getHeight() - 10);

  return doc;
};

export const generateScopeOfWorkDOC = (sowData: any) => {
  // Create HTML content for DOC export
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Scope of Work - ${sowData.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        .client-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .integration-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
        .integration-tag { background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .content { white-space: pre-wrap; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <h1>Scope of Work</h1>
      
      <h2>${sowData.title}</h2>
      
      <div class="client-info">
        <p><strong>Client:</strong> ${sowData.client}</p>
        <p><strong>Contact:</strong> ${sowData.clientContact}</p>
        <p><strong>Industry:</strong> ${sowData.industry}</p>
        <p><strong>Status:</strong> ${sowData.status}</p>
        <p><strong>Pages:</strong> ${sowData.pages}</p>
      </div>
      
      ${sowData.integrations && sowData.integrations.length > 0 ? `
        <h2>Integrations</h2>
        <div class="integration-list">
          ${sowData.integrations.map((integration: string) => 
            `<span class="integration-tag">${integration}</span>`
          ).join('')}
        </div>
      ` : ''}
      
      ${sowData.content ? `
        <h2>Project Details</h2>
        <div class="content">${sowData.content}</div>
      ` : ''}
      
      <div class="footer">
        Generated on: ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sowData.title.replace(/[^a-zA-Z0-9]/g, '_')}_ScopeOfWork.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};