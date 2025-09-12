'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, HardDrive, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type: string;
  extracted_text?: string;
  summary?: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

interface RecentDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onSelectDocument: (document: Document) => void;
}

export function RecentDocumentsModal({
  isOpen,
  onClose,
  documents,
  onSelectDocument
}: RecentDocumentsModalProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Documents Yet
              </h3>
              <p className="text-gray-500">
                Upload your first PDF document to get started with StudyFlow.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((document) => (
                <Card
                  key={document.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    onSelectDocument(document);
                    onClose();
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          {document.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {document.file_name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(document.processing_status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(document.processing_status)}
                          {document.processing_status}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        {formatFileSize(document.file_size)}
                      </div>
                    </div>
                    
                    {document.summary && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {document.summary}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
