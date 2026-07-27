import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download } from 'lucide-react';

interface CertificateGeneratorProps {
  userName: string;
  courseName: string;
  certificateNumber: string;
  issuedDate: string;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  userName,
  courseName,
  certificateNumber,
  issuedDate,
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!certRef.current) return;
    // Use browser print as a PDF workaround
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Certificate - ${certificateNumber}</title>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Georgia, serif; }
        .cert { width: 800px; padding: 60px; border: 8px double #1a56db; text-align: center; position: relative; }
        .cert::before { content: ''; position: absolute; inset: 10px; border: 2px solid #1a56db44; }
        h1 { color: #1a56db; font-size: 36px; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 3px; }
        .name { font-size: 28px; color: #111; margin: 20px 0; border-bottom: 2px solid #1a56db; display: inline-block; padding-bottom: 5px; }
        .course { font-size: 18px; color: #333; }
        .footer { margin-top: 40px; color: #999; font-size: 12px; }
      </style></head><body>
      <div class="cert">
        <p class="subtitle">Certificate of Completion</p>
        <h1>🎓 Synapse</h1>
        <p>This certifies that</p>
        <p class="name">${userName}</p>
        <p>has successfully completed</p>
        <p class="course"><strong>${courseName}</strong></p>
        <div class="footer">
          <p>Certificate #${certificateNumber}</p>
          <p>Issued: ${new Date(issuedDate).toLocaleDateString()}</p>
        </div>
      </div></body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{courseName}</p>
            <p className="text-xs text-muted-foreground">Certificate #{certificateNumber}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-3 h-3 mr-1" /> Download
        </Button>
      </CardContent>
    </Card>
  );
};
