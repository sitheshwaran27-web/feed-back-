"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import SubjectForm from './SubjectForm';
import { Trash2, Edit, MessageSquare, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useSubjects } from '@/hooks/useSubjects';
import { Subject } from '@/types/supabase';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

const SubjectManager: React.FC = () => {
  const { subjects, loading, isSubmitting, addSubject, updateSubject, deleteSubject, fetchSubjects } = useSubjects();
  const { batches, loading: batchesLoading } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Bulk upload state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  type BulkRow = { name: string; period?: number | null; batch_id: string; semester_number: number | null };
  const [parsedRows, setParsedRows] = useState<BulkRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddSubject = async (values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    const newSubject = await addSubject(values);
    if (newSubject) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateSubject = async (values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    if (!editingSubject) return;
    const updatedSubject = await updateSubject(editingSubject.id, values);
    if (updatedSubject) {
      setIsFormOpen(false);
      setEditingSubject(null);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    await deleteSubject(id);
  };

  const openEditForm = (sub: Subject) => {
    setEditingSubject(sub);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSubject(null);
  };

  const filteredSubjects = useMemo(() => {
    let filtered = subjects;

    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (batchFilter !== 'all') {
      filtered = filtered.filter(subject => subject.batch_id === batchFilter);
    }

    if (semesterFilter !== 'all') {
      filtered = filtered.filter(subject => subject.semester_number === parseInt(semesterFilter));
    }

    return filtered;
  }, [subjects, searchTerm, batchFilter, semesterFilter]);

  // Minimal robust CSV parser (handles quoted fields and commas)
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && next === '\n') { i++; }
          row.push(cur); cur = '';
          if (row.length && row.some(c => c !== '')) { rows.push(row); }
          row = [];
        } else { cur += ch; }
      }
    }
    // push last cell
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    // trim trailing empty rows
    return rows.filter(r => r.some(c => c.trim() !== ''));
  };

  const handleTemplateDownload = () => {
    const sample = 'name,period,batch,semester\nData Structures,1,2024-2028,3\nAlgorithms,,2024-2028,3\n';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subjects-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      setParseErrors(['Empty CSV file.']);
      setParsedRows([]);
      return;
    }
    const header = rows[0].map(h => h.trim().toLowerCase());
    const nameIdx = header.indexOf('name');
    const periodIdx = header.indexOf('period');
    const batchIdx = header.indexOf('batch');
    const batchIdIdx = header.indexOf('batch_id');
    const semIdx = header.indexOf('semester');
    const semesterNumIdx = header.indexOf('semester_number');

    if (nameIdx === -1 || (batchIdx === -1 && batchIdIdx === -1)) {
      setParseErrors(['CSV must include columns: name, and either batch or batch_id. Optional: period, semester or semester_number.']);
      setParsedRows([]);
      return;
    }

    const errors: string[] = [];
    const valid: BulkRow[] = [];
    const batchByName = new Map(batches.map(b => [b.name.toLowerCase(), b.id]));
    const batchIds = new Set(batches.map(b => b.id));

    rows.slice(1).forEach((r, idx) => {
      const line = idx + 2; // account for header
      const name = (r[nameIdx] || '').trim();
      if (!name) { errors.push(`Row ${line}: name is required.`); return; }
      const periodRaw = periodIdx !== -1 ? (r[periodIdx] || '').trim() : '';
      const period = periodRaw === '' ? null : Number(periodRaw);
      if (period !== null && (isNaN(period) || period < 0)) { errors.push(`Row ${line}: invalid period.`); return; }

      let batch_id = '';
      if (batchIdIdx !== -1) {
        const val = (r[batchIdIdx] || '').trim();
        if (!val) { errors.push(`Row ${line}: batch_id is required or provide batch.`); return; }
        if (!batchIds.has(val)) { errors.push(`Row ${line}: batch_id '${val}' not found.`); return; }
        batch_id = val;
      } else if (batchIdx !== -1) {
        const val = (r[batchIdx] || '').trim().toLowerCase();
        if (!val) { errors.push(`Row ${line}: batch is required.`); return; }
        const id = batchByName.get(val);
        if (!id) { errors.push(`Row ${line}: batch '${r[batchIdx]}' not found.`); return; }
        batch_id = id;
      }

      const semVal = semIdx !== -1 ? (r[semIdx] || '').trim() : (semesterNumIdx !== -1 ? (r[semesterNumIdx] || '').trim() : '');
      const semester_number = semVal === '' ? null : Number(semVal);
      if (semester_number !== null && (isNaN(semester_number) || semester_number < 1 || semester_number > 12)) {
        errors.push(`Row ${line}: invalid semester.`); return;
      }

      valid.push({ name, period, batch_id, semester_number });
    });

    setParseErrors(errors);
    setParsedRows(valid);
  };

  const handleBulkUpload = async () => {
    if (parsedRows.length === 0) { showError('No valid rows to upload.'); return; }
    setIsUploading(true);
    const payload = parsedRows.map(r => ({
      name: r.name,
      period: r.period,
      batch_id: r.batch_id,
      semester_number: r.semester_number,
    }));
    const { error } = await supabase.from('subjects').insert(payload);
    if (error) {
      console.error('Bulk upload error:', error);
      showError('Bulk upload failed.');
    } else {
      showSuccess(`Uploaded ${payload.length} subjects.`);
      await fetchSubjects();
      setIsBulkOpen(false);
      setParsedRows([]);
      setParseErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setIsUploading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Subjects</CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Bulk Upload Subjects</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a CSV with columns: name, period (optional), batch or batch_id, semester (optional).
                </p>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} />
                  <Button type="button" variant="ghost" onClick={handleTemplateDownload}>Download template</Button>
                </div>
                {parseErrors.length > 0 && (
                  <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                    <p className="font-medium mb-1">Found {parseErrors.length} issue(s):</p>
                    <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-auto">
                      {parseErrors.map((e, i) => (<li key={i}>{e}</li>))}
                    </ul>
                  </div>
                )}
                {parsedRows.length > 0 && (
                  <div className="rounded-md border p-3">
                    <p className="text-sm mb-2">Ready to upload: {parsedRows.length} subject(s).</p>
                    <div className="max-h-48 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject Name</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Semester</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedRows.slice(0, 10).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell>{r.name}</TableCell>
                              <TableCell>{r.period ?? ''}</TableCell>
                              <TableCell>{batches.find(b => b.id === r.batch_id)?.name || r.batch_id}</TableCell>
                              <TableCell>{r.semester_number ?? ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedRows.length > 10 && (
                      <p className="text-xs text-muted-foreground mt-2">Showing first 10 rows.</p>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBulkOpen(false)} disabled={isUploading}>Cancel</Button>
                  <Button onClick={handleBulkUpload} disabled={isUploading || parsedRows.length === 0}>
                    {isUploading ? 'Uploading...' : `Upload ${parsedRows.length} subject(s)`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingSubject(null); setIsFormOpen(true); }}>Add New Subject</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              </DialogHeader>
              {isFormOpen && (
                <SubjectForm
                  initialData={editingSubject ? {
                    name: editingSubject.name,
                    period: editingSubject.period || undefined,
                    batch_id: editingSubject.batch_id || "",
                    semester_number: editingSubject.semester_number || undefined,
                  } : undefined}
                  onSubmit={editingSubject ? handleUpdateSubject : handleAddSubject}
                  onCancel={closeForm}
                  isSubmitting={isSubmitting}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={batchFilter} onValueChange={setBatchFilter} disabled={batchesLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filteredSubjects.length === 0 ? (
          <p className="text-center py-8">
            {searchTerm || batchFilter !== 'all' || semesterFilter !== 'all' ? 'No subjects match your filters.' : 'No subjects added yet. Click "Add New Subject" to get started.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((sub: Subject) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.name} {sub.period ? `(P${sub.period})` : ''}</TableCell>
                  <TableCell>{sub.batches?.name || 'N/A'}</TableCell>
                  <TableCell>{sub.semester_number || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="outline" size="icon">
                            <Link to="/admin/feedback" state={{ subjectId: sub.id }}>
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Feedback</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => openEditForm(sub)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Subject</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ConfirmAlertDialog
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete the subject and any associated feedback and timetable entries."
                            onConfirm={() => handleDeleteSubject(sub.id)}
                          >
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmAlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Subject</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectManager;
