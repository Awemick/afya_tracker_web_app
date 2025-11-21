import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Image,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  Search,
  FilterList,
  MoreVert,
  Download,
  Delete,
  Share,
  Visibility,
  Edit,
  Add,
  Folder,
  Lock,
  Public,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { medicalRecordsAPI } from '../../services/api';
import {
  fetchRecordsStart,
  fetchRecordsSuccess,
  fetchRecordsFailure,
  uploadRecordStart,
  uploadRecordProgress,
  uploadRecordSuccess,
  uploadRecordFailure,
  deleteRecord,
  selectRecord,
  clearSelectedRecord,
} from '../../store/slices/medicalRecordsSlice';
import { MedicalRecord, FilePermissions } from '../../types';

interface DigitalRecordStorageProps {
  patientId?: string;
  institutionId: string;
  userRole: 'patient' | 'provider' | 'admin';
  userId: string;
  onRecordSelect?: (record: MedicalRecord) => void;
}

const DigitalRecordStorage: React.FC<DigitalRecordStorageProps> = ({
  patientId,
  institutionId,
  userRole,
  userId,
  onRecordSelect,
}) => {
  const dispatch = useDispatch();
  const {
    records,
    selectedRecord,
    loading,
    error,
    uploadProgress,
  } = useSelector((state: RootState) => state.medicalRecords);

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadMetadata, setUploadMetadata] = useState({
    category: 'other' as MedicalRecord['category'],
    description: '',
    tags: [] as string[],
    isConfidential: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, [patientId, institutionId]);

  const loadRecords = async () => {
    dispatch(fetchRecordsStart());
    try {
      const response = patientId
        ? await medicalRecordsAPI.getPatientRecords(patientId)
        : await medicalRecordsAPI.getInstitutionRecords(institutionId);
      dispatch(fetchRecordsSuccess(response.data));
    } catch (error) {
      dispatch(fetchRecordsFailure('Failed to load medical records'));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      const metadata = {
        patientId,
        institutionId,
        uploadedBy: userId,
        category: uploadMetadata.category,
        description: uploadMetadata.description,
        tags: uploadMetadata.tags,
        isConfidential: uploadMetadata.isConfidential,
        accessPermissions: {
          view: [userId], // Default: uploader can view
          download: [userId], // Default: uploader can download
          share: [userId], // Default: uploader can share
        } as FilePermissions,
      };

      dispatch(uploadRecordStart(file.name));

      try {
        const response = await medicalRecordsAPI.uploadFile(
          file,
          metadata,
          (progress) => dispatch(uploadRecordProgress({ id: file.name, progress }))
        );
        dispatch(uploadRecordSuccess((response as any).data));
      } catch (error) {
        dispatch(uploadRecordFailure({ id: file.name, error: 'Upload failed' }));
      }
    }

    setSelectedFiles([]);
    setUploadDialogOpen(false);
    setUploadMetadata({
      category: 'other',
      description: '',
      tags: [],
      isConfidential: false,
    });
  };

  const handleDelete = async (recordId: string) => {
    try {
      await medicalRecordsAPI.deleteRecord(recordId);
      dispatch(deleteRecord(recordId));
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const handleDownload = async (record: MedicalRecord) => {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = record.storageUrl;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update last accessed
      await medicalRecordsAPI.updateRecord(record.id, {});
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image />;
    if (fileType === 'application/pdf') return <PictureAsPdf />;
    if (fileType.includes('video/')) return <VideoFile />;
    if (fileType.includes('audio/')) return <AudioFile />;
    if (fileType.includes('text/') || fileType.includes('document')) return <Description />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const canViewRecord = (record: MedicalRecord) => {
    return record.accessPermissions.view.includes(userId) ||
           userRole === 'admin' ||
           record.uploadedBy === userId;
  };

  const canDownloadRecord = (record: MedicalRecord) => {
    return record.accessPermissions.download.includes(userId) ||
           userRole === 'admin' ||
           record.uploadedBy === userId;
  };

  const canDeleteRecord = (record: MedicalRecord) => {
    return userRole === 'admin' || record.uploadedBy === userId;
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Digital Medical Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Files
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
            <TextField
              fullWidth
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="ultrasound">Ultrasound</MenuItem>
                <MenuItem value="lab_results">Lab Results</MenuItem>
                <MenuItem value="prescription">Prescription</MenuItem>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredRecords.length} records found
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Upload Zone */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: 'grey.300',
          bgcolor: 'grey.50',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Click to upload medical files
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select files (PDF, images, documents up to 10MB)
        </Typography>
      </Paper>

      {/* Records List */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {filteredRecords.map((record) => (
          <Card key={record.id} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {getFileIcon(record.fileType)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" noWrap>
                    {record.fileName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(record.fileSize)} • {record.category}
                  </Typography>
                </Box>
                {record.isConfidential && (
                  <Lock sx={{ color: 'warning.main' }} />
                )}
              </Box>

              {record.description && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {record.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {record.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" variant="outlined" />
                ))}
              </Box>

              <Typography variant="caption" color="text.secondary">
                Uploaded {new Date(record.uploadedAt).toLocaleDateString()}
                {record.lastAccessed && ` • Last accessed ${new Date(record.lastAccessed).toLocaleDateString()}`}
              </Typography>
            </CardContent>

            <CardActions>
              {canViewRecord(record) && (
                <Tooltip title="Preview">
                  <IconButton onClick={() => {
                    dispatch(selectRecord(record));
                    setPreviewDialogOpen(true);
                  }}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
              )}

              {canDownloadRecord(record) && (
                <Tooltip title="Download">
                  <IconButton onClick={() => handleDownload(record)}>
                    <Download />
                  </IconButton>
                </Tooltip>
              )}

              {canDeleteRecord(record) && (
                <Tooltip title="Delete">
                  <IconButton onClick={() => handleDelete(record.id)} color="error">
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).map((fileName) => (
        <Box key={fileName} sx={{ mt: 2 }}>
          <Typography variant="body2">{fileName}</Typography>
          <LinearProgress variant="determinate" value={uploadProgress[fileName]} />
        </Box>
      ))}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Medical Records</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Selected files: {selectedFiles.map(f => f.name).join(', ')}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={uploadMetadata.category}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, category: e.target.value as MedicalRecord['category'] }))}
                label="Category"
              >
                <MenuItem value="ultrasound">Ultrasound</MenuItem>
                <MenuItem value="lab_results">Lab Results</MenuItem>
                <MenuItem value="prescription">Prescription</MenuItem>
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description (optional)"
              value={uploadMetadata.description}
              onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="Tags (comma-separated)"
              value={uploadMetadata.tags.join(', ')}
              onChange={(e) => setUploadMetadata(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained" disabled={selectedFiles.length === 0}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRecord?.fileName}
          <IconButton
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Delete />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ textAlign: 'center' }}>
              {selectedRecord.fileType.startsWith('image/') ? (
                <img
                  src={selectedRecord.storageUrl}
                  alt={selectedRecord.fileName}
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              ) : selectedRecord.fileType === 'application/pdf' ? (
                <iframe
                  src={selectedRecord.storageUrl}
                  style={{ width: '100%', height: '400px', border: 'none' }}
                  title={selectedRecord.fileName}
                />
              ) : (
                <Box sx={{ p: 4 }}>
                  <InsertDriveFile sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6">{selectedRecord.fileName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(selectedRecord.fileSize)}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handleDownload(selectedRecord)}
                    sx={{ mt: 2 }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DigitalRecordStorage;