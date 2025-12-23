import * as React from 'react';
import { useState, useEffect } from 'react';
import { Bell, FileText, Eye, Download } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Document {
  type: string;
  fileName: string;
}

interface Application {
  id: string;
  title: string;
  submittedDate: string;
  status: string;
  documents: Document[];
}

const UploadedFiles = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    const storedApplications = localStorage.getItem('submittedApplications');
    if (storedApplications) {
      setApplications(JSON.parse(storedApplications));
    }
  }, []);

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleDownload = (fileName: string) => {
    console.log('Downloading:', fileName);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <h1 className="text-base font-normal text-foreground hidden sm:block">
                  Final International University Ethic committee
                </h1>
              </div>
              
              <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-foreground" />
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Uploaded Files
              </h2>
              <p className="text-base text-muted-foreground mt-1">
                View all documents uploaded for your research studies
              </p>
            </div>

            {/* Applications List */}
            <div className="space-y-6">
              {applications.length > 0 ? (
                applications.map((application) => (
                  <div 
                    key={application.id} 
                    className="bg-card rounded-lg shadow-sm border border-border p-6"
                  >
                    {/* Application Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {application.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {application.id} • Submitted: {application.submittedDate}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-amber-50 text-amber-600 border-amber-200 whitespace-nowrap self-start"
                      >
                        {application.status}
                      </Badge>
                    </div>

                    {/* Documents List */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Uploaded Documents:
                      </p>
                      <div className="space-y-2">
                        {application.documents.map((doc, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {doc.type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.fileName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(doc)}
                                className="text-primary hover:text-primary/80"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc.fileName)}
                                className="text-primary hover:text-primary/80"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No documents uploaded yet. Submit an application to see your files here.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <FileText className="w-10 h-10 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{selectedDocument.type}</p>
                  <p className="text-sm text-muted-foreground">{selectedDocument.fileName}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleDownload(selectedDocument.fileName)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default UploadedFiles;
