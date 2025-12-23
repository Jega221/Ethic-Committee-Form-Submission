import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X } from 'lucide-react';

interface DocumentViewerProps {
    isOpen: boolean;
    onClose: () => void;
    documentUrl: string;
    documentName: string;
    documentType?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
    isOpen,
    onClose,
    documentUrl,
    documentName,
    documentType = '',
}) => {
    const isImage = documentType?.startsWith('image/');
    const isPDF = documentType?.includes('pdf');

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenNewTab = () => {
        window.open(documentUrl, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold truncate pr-4">
                            {documentName}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                title="Download document"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenNewTab}
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                New Tab
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-0" style={{ height: 'calc(90vh - 100px)' }}>
                    {isImage ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 p-4">
                            <img
                                src={documentUrl}
                                alt={documentName}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    ) : isPDF || documentType === '' ? (
                        <iframe
                            src={documentUrl}
                            className="w-full h-full border-0"
                            title={documentName}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
                            <div className="max-w-md">
                                <p className="text-lg font-semibold text-slate-700 mb-2">
                                    Preview not available
                                </p>
                                <p className="text-sm text-slate-500 mb-6">
                                    This file type ({documentType}) cannot be previewed in the browser.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Button onClick={handleDownload} className="bg-destructive hover:bg-destructive/90">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download File
                                    </Button>
                                    <Button onClick={handleOpenNewTab} variant="outline">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open in New Tab
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
